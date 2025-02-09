import { ClockIcon, UserGroupIcon } from '@heroicons/react/outline'
import { FireIcon, PencilIcon } from '@heroicons/react/solid'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Row } from '../layout/row'
import { Contract, updateContract } from 'web/lib/firebase/contracts'
import { DateTimeTooltip } from '../widgets/datetime-tooltip'
import { fromNow } from 'web/lib/util/time'
import { useState } from 'react'
import { Button } from 'web/components/buttons/button'
import { Modal } from 'web/components/layout/modal'
import { Col } from 'web/components/layout/col'
import { linkClass } from 'web/components/widgets/site-link'
import { Tooltip } from 'web/components/widgets/tooltip'
import { getGroupLinkToDisplay, groupPath } from 'common/group'
import { Title } from '../widgets/title'
import { useIsClient } from 'web/hooks/use-is-client'
import { Input } from '../widgets/input'
import { Avatar } from '../widgets/avatar'
import { UserLink } from '../widgets/user-link'

export type ShowTime = 'resolve-date' | 'close-date'

export function MiscDetails(props: {
  contract: Contract
  showTime?: ShowTime
  hideGroupLink?: boolean
}) {
  const { contract, showTime, hideGroupLink } = props
  const { closeTime, resolutionTime, uniqueBettorCount } = contract

  const isClient = useIsClient()
  // const isNew = createdTime > Date.now() - DAY_MS && !isResolved
  const groupToDisplay = getGroupLinkToDisplay(contract)
  const isOpen =
    !contract.isResolved && (contract.closeTime ?? Infinity) > Date.now()

  return (
    <Row className="text-ink-400 w-full items-center gap-3 text-sm">
      {isOpen && contract.elasticity < 0.5 ? (
        <Tooltip text={'High-stakes'} className={'z-10'}>
          <FireIcon className="h-5 w-5 text-blue-700" />
        </Tooltip>
      ) : null}

      {isClient && showTime === 'close-date' ? (
        <Row className="gap-0.5 whitespace-nowrap">
          <ClockIcon className="h-5 w-5" />
          {(closeTime || 0) < Date.now() ? 'Closed' : 'Closes'}{' '}
          {fromNow(closeTime || 0)}
        </Row>
      ) : isClient && showTime === 'resolve-date' && resolutionTime ? (
        <Row className="gap-0.5">
          <ClockIcon className="h-5 w-5" />
          {'Resolved '}
          {fromNow(resolutionTime)}
        </Row>
      ) : (uniqueBettorCount ?? 0) > 1 ? (
        <Tooltip
          text={`${uniqueBettorCount} unique traders`}
          className={'z-10'}
        >
          <Row className={'shrink-0 items-center gap-1'}>
            <UserGroupIcon className="h-4 w-4" />
            <div className="font-semibold">{uniqueBettorCount || '0'}</div>
          </Row>
        </Tooltip>
      ) : (
        <></>
      )}

      {!hideGroupLink && groupToDisplay && (
        <Link
          prefetch={false}
          href={groupPath(groupToDisplay.slug)}
          className={clsx(
            linkClass,
            'text-ink-400 z-10 max-w-[8rem] truncate text-sm'
          )}
        >
          {groupToDisplay.name}
        </Link>
      )}
    </Row>
  )
}

export function AuthorInfo(props: { contract: Contract }) {
  const { contract } = props
  const { creatorName, creatorUsername, creatorAvatarUrl, creatorCreatedTime } =
    contract

  return (
    <Row className="grow items-center gap-2">
      <div className="relative">
        <Avatar
          username={creatorUsername}
          avatarUrl={creatorAvatarUrl}
          size={'xs'}
        />
      </div>

      <UserLink
        name={creatorName}
        username={creatorUsername}
        createdTime={creatorCreatedTime}
      />
    </Row>
  )
}

export function CloseOrResolveTime(props: {
  contract: Contract
  editable?: boolean
  className?: string
}) {
  const { contract, editable, className } = props
  const { resolutionTime, closeTime, isResolved } = contract
  if (contract.outcomeType === 'STONK') {
    return <></>
  }

  const almostForeverTime = dayjs(contract.createdTime).add(
    dayjs.duration(900, 'year')
  )
  if (
    contract.outcomeType === 'POLL' &&
    dayjs(closeTime).isAfter(almostForeverTime)
  ) {
    return <>Never closes</>
  }
  if (!!closeTime || !!isResolved) {
    return (
      <Row className={clsx('select-none items-center', className)}>
        {isResolved && resolutionTime && (
          <DateTimeTooltip
            className="whitespace-nowrap"
            text="Question resolved:"
            time={resolutionTime}
            placement="bottom-start"
          >
            resolved {dayjs(resolutionTime).format('MMM D')}
          </DateTimeTooltip>
        )}

        {!isResolved && closeTime && (
          <EditableCloseDate
            closeTime={closeTime}
            contract={contract}
            editable={!!editable}
          />
        )}
      </Row>
    )
  } else return <></>
}

function EditableCloseDate(props: {
  closeTime: number
  contract: Contract
  editable: boolean
}) {
  const { closeTime, contract, editable } = props

  const isClient = useIsClient()
  const dayJsCloseTime = dayjs(closeTime)
  const dayJsNow = dayjs()

  const [isEditingCloseTime, setIsEditingCloseTime] = useState(false)
  const [closeDate, setCloseDate] = useState(
    closeTime && dayJsCloseTime.format('YYYY-MM-DD')
  )
  const [closeHoursMinutes, setCloseHoursMinutes] = useState(
    closeTime && dayJsCloseTime.format('HH:mm')
  )

  const isSameYear = dayJsCloseTime.isSame(dayJsNow, 'year')
  const isSameDay = dayJsCloseTime.isSame(dayJsNow, 'day')
  const isSoon = dayJsCloseTime.diff(dayJsNow, 'month') < 4

  let newCloseTime = closeDate
    ? dayjs(`${closeDate}T${closeHoursMinutes}`).valueOf()
    : undefined

  function onSave(customTime?: number) {
    if (customTime) {
      newCloseTime = customTime
      setCloseDate(dayjs(newCloseTime).format('YYYY-MM-DD'))
      setCloseHoursMinutes(dayjs(newCloseTime).format('HH:mm'))
    }
    if (!newCloseTime) return

    setIsEditingCloseTime(false)
    if (newCloseTime !== closeTime) {
      updateContract(contract.id, {
        closeTime: newCloseTime,
      })
    }
  }

  return (
    <>
      <Modal
        size="md"
        open={isEditingCloseTime}
        setOpen={setIsEditingCloseTime}
        position="top"
      >
        <Col className="bg-canvas-0 rounded-lg p-8">
          <Title className="!text-2xl">Close time</Title>
          <div className="mb-4">Trading will halt at this time</div>
          <Row className="items-stretch gap-2">
            <Input
              type="date"
              className="shrink-0 sm:w-fit"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setCloseDate(e.target.value)}
              min={isClient ? dayJsNow.format('YYYY-MM-DD') : undefined}
              max="9999-12-31"
              value={closeDate}
            />
            <Input
              type="time"
              className="shrink-0 sm:w-max"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setCloseHoursMinutes(e.target.value)}
              value={closeHoursMinutes}
            />
            <Button size="xl" onClick={() => onSave()}>
              Save
            </Button>
          </Row>

          {(contract.closeTime ?? Date.now() + 1) > Date.now() && (
            <Row className="mt-8 justify-center">
              <Button
                size={'xs'}
                color="yellow"
                onClick={() => onSave(Date.now())}
              >
                Close question now
              </Button>
            </Row>
          )}
        </Col>
      </Modal>

      <Row
        className={clsx('items-center gap-1', editable ? 'cursor-pointer' : '')}
        onClick={() => editable && setIsEditingCloseTime(true)}
      >
        <DateTimeTooltip
          text={closeTime <= Date.now() ? 'Trading ended:' : 'Trading ends:'}
          time={closeTime}
          placement="bottom-end"
          noTap
          className="flex items-center"
        >
          {dayjs().isBefore(closeTime) ? 'closes' : 'closed'}{' '}
          {isSameDay
            ? fromNow(closeTime)
            : isSameYear || isSoon
            ? dayJsCloseTime.format('MMM D')
            : dayJsCloseTime.format('YYYY')}
        </DateTimeTooltip>
        {editable && <PencilIcon className="h-4 w-4" />}
      </Row>
    </>
  )
}
