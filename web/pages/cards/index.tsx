import { Page } from 'web/components/layout/page'
import { Spacer } from 'web/components/layout/spacer'
import { useUser } from 'web/hooks/use-user'
import {
  QuestionCard,
  useTopQuestionsByUser,
} from 'web/components/cards/QuestionCard'
import { groupBy, shuffle } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { Row } from 'web/components/layout/row'
import { Col } from 'web/components/layout/col'
import { Button } from 'web/components/buttons/button'
import { UserCard } from 'web/components/cards/UserCard'
import { getContracts } from 'common/supabase/contracts'
import { db } from 'web/lib/supabase/db'
import { Contract } from 'common/contract'
import { useRouter } from 'next/router'
import { Grenze_Gotisch } from 'next/font/google'
import clsx from 'clsx'

const fancyFont = Grenze_Gotisch({
  weight: ['300', '500', '700'],
  variable: '--font-match-cards',
  subsets: ['latin'],
})

const TOTAL_QUESTIONS = 5

const DEFAULT_QUESTIONS = [
  'YTIuuSsNRn2OlA4KykRM',
  'DreezzZ09K5d4ee1E64l',
  'YBxwKfe5eY2Ynw1ACGYI',
  '0GswU1qy80Sk1UogWuKR',
  'NRLwgQYqCLk5zTasmxOn',
  'usSjx2AtbUvfg7QNq5g2',
  '4MkPyu5D9MRLPREODSD7',
]

function useContractsByIds(ids: string[]) {
  const [contracts, setContracts] = useState<Contract[]>([])
  useEffect(() => {
    getContracts(ids, db).then((contracts) => setContracts(contracts))
  }, [ids])
  return contracts
}

// A memory game with 2 rows of TOTAL_QUESTIONS cards
// Users flip 2 cards at a time; if they match, they stay flipped
export default function CardsPage() {
  const router = useRouter()
  // GAME STATE
  // Boolean array of whether each card is faceup
  const [faceups, setFaceups] = useState<boolean[]>(
    Array.from({ length: TOTAL_QUESTIONS * 2 }, () => false)
  )
  // Last card clicked
  const [clicked, setClicked] = useState<number | undefined>(undefined)
  // Total clicks
  const [clicks, setClicks] = useState(0)
  const [matches, setMatches] = useState(0)
  const [waiting, setWaiting] = useState(false)

  // GAME DATA
  const user = useUser()
  // TODO: what if user doesn't have enough top questions?
  const topQuestions = useTopQuestionsByUser(user?.id ?? '')
  const defaults = useContractsByIds(DEFAULT_QUESTIONS)
  const shuffledQuestions = useMemo(
    () => shuffle([...topQuestions, ...defaults]),
    [topQuestions.length]
  )
  const groupedQuestions = groupBy(shuffledQuestions, 'creatorId')
  const questions = Object.values(groupedQuestions)
    .filter((group) => group.length === 1)
    .flat()
    .slice(0, TOTAL_QUESTIONS)
  const questionCreators = questions.map((question) => question.creatorId)
  const creators = useMemo(
    () => shuffle(questionCreators),
    [topQuestions.length]
  )

  function clicksMatch(a: number, b: number) {
    // Set i to be the lesser, and j to be the greater
    const i = Math.min(a, b)
    const j = Math.max(a, b)
    if (i >= TOTAL_QUESTIONS || j < TOTAL_QUESTIONS) {
      return false
    }
    return questions[i].creatorId === creators[j - TOTAL_QUESTIONS]
  }

  function click(index: number) {
    if (waiting) return
    setClicks(clicks + 1)
    const newFaceups = [...faceups]
    newFaceups[index] = true
    setFaceups(newFaceups)
    if (clicked === undefined) {
      setClicked(index)
    } else {
      if (clicksMatch(clicked, index)) {
        setMatches(matches + 1)
        setClicked(undefined)
      } else {
        setWaiting(true)
        // Wait for 1s, then flip them back down
        setTimeout(() => {
          const newFaceups = [...faceups]
          newFaceups[clicked] = false
          newFaceups[index] = false
          setFaceups(newFaceups)
          setWaiting(false)
          setClicked(undefined)
        }, 2000)
      }
    }
  }

  return (
    <Page
      className={clsx('!max-w-7xl p-2', fancyFont.variable)}
      mainClassName="!col-span-10"
    >
      <Row className="justify-between">
        <Col>
          <h1 className="font-grenze-gotisch text-6xl">
            Manifold: the Gambling
          </h1>
          <Spacer h={4} />
          <h2 className="text-2xl">Match each question to its creator!</h2>
          <h2 className="block sm:hidden">(Best played on desktop 😛)</h2>
        </Col>
        <Col className="justify-end">
          <h2 className="text-6xl">
            {/* Show a ✅ for each match */}{' '}
            {Array.from({ length: matches }, () => (
              <span>✅</span>
            ))}
            {/* And a ❌ for non-matches */}
            {Array.from({ length: TOTAL_QUESTIONS - matches }, () => (
              <span>🃏</span>
            ))}
          </h2>
          <Spacer h={4} />
          <h2 className="text-right text-2xl">Clicks: {clicks}</h2>
        </Col>
      </Row>
      <Spacer h={4} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {questions.map((contract, i) => (
          <QuestionCard
            contract={contract}
            faceup={faceups[i]}
            onClick={() => click(i)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {creators.map((userId, i) => (
          <UserCard
            userId={userId}
            faceup={faceups[TOTAL_QUESTIONS + i]}
            onClick={() => click(TOTAL_QUESTIONS + i)}
          />
        ))}
      </div>
      {matches === TOTAL_QUESTIONS && (
        <Button
          size="2xl"
          color="gradient"
          className="mx-auto max-w-md"
          onClick={() => router.reload()}
        >
          Play again!
        </Button>
      )}
    </Page>
  )
}
