import { Col } from 'web/components/layout/col'
import { Page } from 'web/components/layout/page'
import { Title } from 'web/components/widgets/title'
import { useTracking } from 'web/hooks/use-tracking'
import {
  ActivityLog,
  LivePillOptions,
  pill_options,
} from 'web/components/activity-log'
import { usePersistentInMemoryState } from 'web/hooks/use-persistent-in-memory-state'
import { SEO } from 'web/components/SEO'

export default function LivePage() {
  useTracking('view live page')

  return (
    <Page>
      <SEO
        title="Live"
        description="Watch all site activity live, including bets, comments, and new questions."
        url="/live"
      />

      <Col className="gap-4 sm:px-4 sm:pb-4">
        <Title className="mx-2 !mb-0 mt-2 sm:mx-0 lg:mt-0">Live feed</Title>
        <LiveFeed />
      </Col>
    </Page>
  )
}

export const LiveFeed = () => {
  const [pill, setPill] = usePersistentInMemoryState<pill_options>(
    'all',
    'live-pill'
  )

  return (
    <Col className="gap-4">
      <LivePillOptions pill={pill} setPill={setPill} />
      <ActivityLog count={30} pill={pill} />
    </Col>
  )
}
