import { useEffect } from 'react'
import { QUADRANTS, type Quadrant } from './session'

const MEANING: Record<Quadrant, string> = {
  option: '가능한 선택지를 넓게 펼친다',
  hypothesis: '하나를 골라 결과를 머릿속으로 그려 본다',
  loop: '액션 → 관찰 → 해석을 빠르게 돈다',
  map: '배운 것을 큰 그림으로 정리한다',
}

const CONTROLS: [key: string, does: string, desktopOnly?: boolean][] = [
  ['Space', '다음 단계'],
  ['Backspace', '되돌리기'],
  ['칸 클릭', '그 단계로 이동 (액션·관찰·해석도)'],
  ['⌘⇧Space', '다른 앱에서도 다음 단계', true],
  ['↺', '새 세션'],
  ['?', '이 가이드 열고 닫기'],
]

const heading = 'mb-1 text-[11px] font-semibold text-accent'

function GuideContent() {
  return (
    <>
      <p className="mb-2 pr-4">학습하는 동안 지금 내 의식이 네 모드 중 어디에 있는지 보이게 하는 도구.</p>

      <h2 className={heading}>네 단계</h2>
      <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        {(Object.keys(QUADRANTS) as Quadrant[]).map((q) => (
          <div key={q} className="contents">
            <dt className="font-semibold text-stone-800 dark:text-stone-100">{QUADRANTS[q].label}</dt>
            <dd>
              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                {QUADRANTS[q].row}·{QUADRANTS[q].col}
              </span>{' '}
              {MEANING[q]}
            </dd>
          </div>
        ))}
      </dl>

      <h2 className={heading}>조작</h2>
      <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        {CONTROLS.filter(([, , desktopOnly]) => !desktopOnly || window.wildLearning).map(([key, does]) => (
          <div key={key} className="contents">
            <dt>
              <kbd className="font-sans font-semibold text-accent">{key}</kbd>
            </dt>
            <dd>{does}</dd>
          </div>
        ))}
      </dl>

      {window.wildLearning && (
        <p className="text-[11px] text-stone-400 dark:text-stone-500">메뉴 막대에도 지금 단계가 나온다.</p>
      )}
    </>
  )
}

const card = 'text-[12px] leading-snug text-stone-600 dark:text-stone-300'

export function GuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      data-testid="guide"
      onClick={onClose}
      className="absolute inset-0 z-20 flex items-center justify-center bg-stone-900/30 p-1.5 dark:bg-black/50"
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className={`relative max-h-full w-full max-w-[300px] overflow-y-auto rounded-lg bg-white px-3 py-2.5 shadow-lg dark:bg-stone-800 ${card}`}
      >
        <button
          type="button"
          title="닫기 (Esc)"
          onClick={onClose}
          className="absolute top-1.5 right-2 cursor-pointer text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
        >
          ✕
        </button>
        <GuideContent />
      </section>
    </div>
  )
}

export function GuidePage() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === '?') window.wildLearning?.closeWindow()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  return (
    <main className={`h-full overflow-y-auto bg-stone-50 px-4 py-3 dark:bg-stone-900 ${card}`}>
      <GuideContent />
    </main>
  )
}
