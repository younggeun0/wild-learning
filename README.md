# wild-learning

김창준의 "야생 학습의 네 가지 모드" 그림 위에 말을 하나 올려, 지금 주의가 어느 모드에 있는지 보여주는 macOS 위젯 앱과 웹앱.

- 말은 옵션 → 가설 → 액션 → 관찰 → 해석 → 지도 → 옵션 순서로 움직인다. Space는 액션·관찰·해석 고리를 한 번만 돌고 지도로 넘어간다
- 고리를 다시 돌고 싶으면 원하는 정거장 이름을 누른다
- 위쪽에 바퀴 수(지도 → 옵션으로 넘어간 횟수)와 지금 정거장에 머문 시간이 보이고, 마우스를 올리면 정거장별로 머문 시간이 나온다
- ↺ 버튼은 기록을 지우고 새 세션을 시작한다. 세션은 localStorage에 남아 다시 열어도 이어진다
- 위젯은 항상 위에 떠 있고, 상단을 끌어 옮기고 우하단 손잡이로 크기를 바꾼다 (최소 220×200)

### 단축키

| 단축키 | 설명 |
| --- | --- |
| `Space` | 다음 정거장 |
| `cmd + shift + space` | 다음 정거장 (데스크톱, 다른 앱에 포커스가 있어도) |
| `Backspace` | 마지막 이동 되돌리기 |
| 정거장 이름 클릭 | 그 정거장으로 이동 |

### 개발

Rust(`rustup`)와 Node 22 이상이 필요하다.

```sh
npm install
npm run dev        # tauri dev
npm test           # vitest (세션 reducer)
npm run build      # src-tauri/target/release/bundle에 앱·dmg 생성
npm run build:web  # 웹앱을 dist에 빌드 (Vercel용, npx vite preview로 확인)
```

웹앱은 같은 renderer를 Tauri 브리지 없이 띄운다. `window.wildLearning`이 없으면 전역 단축키·창 크기 손잡이 없이 동작한다.
