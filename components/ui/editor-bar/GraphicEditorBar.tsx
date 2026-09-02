import { EditorBarShell } from "./EditorBarShell"

type GraphicEditorBarProps = {
  show: boolean
  // Mirrors create-omat's isAiEditable: the "Modify with AI" item only appears
  // for artwork that came out of the AI panel.
  isAi?: boolean
  onDuplicate: () => void
  onDelete: () => void
}

// create-omat's design editor bar (src/components/ui/editor-bar/index.tsx →
// `design` items), minus the Colors item for now. Only duplicate and delete are
// wired up — the rest render with their hover state but do nothing on click yet.

function ShapeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 8.6661C6.73616 8.6661 7.33266 9.26303 7.33301 9.99911V12.6661C7.33301 13.4025 6.73638 13.9991 6 13.9991H3.33301C2.59678 13.9989 2 13.4024 2 12.6661V9.99911C2.00035 9.26314 2.59699 8.66628 3.33301 8.6661H6ZM11.334 8.6661C12.8063 8.66645 13.9998 9.8607 14 11.3331C13.9998 12.8055 12.8063 13.9988 11.334 13.9991C9.86133 13.9991 8.66717 12.8057 8.66699 11.3331C8.66717 9.86049 9.86133 8.6661 11.334 8.6661ZM3.33301 12.6661H6V9.99911H3.33301V12.6661ZM11.334 9.99911C10.5977 9.99911 10.0002 10.5969 10 11.3331C10.0002 12.0693 10.5977 12.6661 11.334 12.6661C12.07 12.6658 12.6668 12.0691 12.667 11.3331C12.6668 10.5971 12.07 9.99946 11.334 9.99911ZM7.4209 1.66903C7.67686 1.22133 8.32218 1.22132 8.57812 1.66903L11.2451 6.33602C11.4987 6.7804 11.1778 7.3331 10.666 7.3331H5.33301C4.82158 7.33278 4.50055 6.78025 4.75391 6.33602L7.4209 1.66903ZM6.48145 6.00009H9.5166L7.99902 3.34384L6.48145 6.00009Z"
        fill="currentColor"
      />
    </svg>
  )
}

function GrainIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 4.5C7.5 3.39543 8.39543 2.5 9.5 2.5C10.6046 2.5 11.5 3.39543 11.5 4.5C11.5 5.60457 10.6046 6.5 9.5 6.5C8.39543 6.5 7.5 5.60457 7.5 4.5ZM2.5 9.5C2.5 8.39543 3.39543 7.5 4.5 7.5C5.60457 7.5 6.5 8.39543 6.5 9.5C6.5 10.6046 5.60457 11.5 4.5 11.5C3.39543 11.5 2.5 10.6046 2.5 9.5ZM9.5 12.5C8.39543 12.5 7.5 13.3954 7.5 14.5C7.5 15.6046 8.39543 16.5 9.5 16.5C10.6046 16.5 11.5 15.6046 11.5 14.5C11.5 13.3954 10.6046 12.5 9.5 12.5ZM2.5 19.5C2.5 18.3954 3.39543 17.5 4.5 17.5C5.60457 17.5 6.5 18.3954 6.5 19.5C6.5 20.6046 5.60457 21.5 4.5 21.5C3.39543 21.5 2.5 20.6046 2.5 19.5ZM14.5 7.5C13.3954 7.5 12.5 8.39543 12.5 9.5C12.5 10.6046 13.3954 11.5 14.5 11.5C15.6046 11.5 16.5 10.6046 16.5 9.5C16.5 8.39543 15.6046 7.5 14.5 7.5ZM17.5 4.5C17.5 3.39543 18.3954 2.5 19.5 2.5C20.6046 2.5 21.5 3.39543 21.5 4.5C21.5 5.60457 20.6046 6.5 19.5 6.5C18.3954 6.5 17.5 5.60457 17.5 4.5ZM14.5 17.5C13.3954 17.5 12.5 18.3954 12.5 19.5C12.5 20.6046 13.3954 21.5 14.5 21.5C15.6046 21.5 16.5 20.6046 16.5 19.5C16.5 18.3954 15.6046 17.5 14.5 17.5ZM17.5 14.5C17.5 13.3954 18.3954 12.5 19.5 12.5C20.6046 12.5 21.5 13.3954 21.5 14.5C21.5 15.6046 20.6046 16.5 19.5 16.5C18.3954 16.5 17.5 15.6046 17.5 14.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function AiStarsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M8 4C8.4 7.6 11.4 10.6 15 11C11.4 11.4 8.4 14.4 8 18C7.6 14.4 4.6 11.4 1 11C4.6 10.6 7.6 7.6 8 4Z"
        fill="currentColor"
      />
      <path
        d="M19 2C19.2 3.8 20.7 5.3 22.5 5.5C20.7 5.7 19.2 7.2 19 9C18.8 7.2 17.3 5.7 15.5 5.5C17.3 5.3 18.8 3.8 19 2Z"
        fill="currentColor"
      />
      <path
        d="M18 14C18.3 16.2 20.1 18 22.3 18.3C20.1 18.6 18.3 20.4 18 22.6C17.7 20.4 15.9 18.6 13.7 18.3C15.9 18 17.7 16.2 18 14Z"
        fill="currentColor"
      />
    </svg>
  )
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M8.00062 1.33325C8.34238 1.33339 8.62421 1.59066 8.66273 1.92212L8.66663 2.00024V14.0002C8.66646 14.3682 8.36858 14.6661 8.00062 14.6663C7.65873 14.6663 7.37702 14.409 7.33851 14.0774L7.33363 14.0002V2.00024C7.33363 1.63205 7.63243 1.33325 8.00062 1.33325ZM5.48695 4.01782L5.55824 4.03931L5.59339 4.05298L5.63148 4.07056L5.69886 4.10962L5.76038 4.15454L5.81507 4.2063L5.8639 4.26196L5.90492 4.32349L5.9391 4.38794L5.96644 4.4563L5.98499 4.52661L5.99574 4.58911L6.00062 4.66724V11.3333C6.00054 11.6749 5.74302 11.9566 5.41175 11.9954L5.33363 12.0002H2.00062C1.53116 12.0002 1.21708 11.5318 1.37367 11.1057L1.40394 11.0354L4.73695 4.36841L4.77601 4.30103L4.82093 4.2395L4.87269 4.18481L4.92933 4.13696L4.98988 4.09497L5.05433 4.06079L5.12269 4.03442L5.193 4.01489L5.26527 4.00317C5.33826 3.99563 5.41343 4.00038 5.48695 4.01782ZM10.7448 4.00513L10.82 4.01782L10.8922 4.03931L10.9606 4.0686L11.025 4.10376L11.0846 4.14673L11.1383 4.19556L11.1871 4.25024L11.2301 4.30981L11.2633 4.36841L14.5973 11.0354C14.8067 11.455 14.5285 11.9456 14.0778 11.9963L14.0006 12.0002H10.6676C10.3259 12.0002 10.0442 11.7427 10.0055 11.4114L10.0006 11.3333L10.0016 4.63599L10.0055 4.58911L10.0182 4.51392L10.0397 4.44263L10.068 4.37427L10.1041 4.30981L10.1471 4.25024L10.1959 4.19556L10.2506 4.14673L10.3102 4.10376L10.3707 4.06958C10.3961 4.05727 10.4188 4.04764 10.442 4.03931L10.5133 4.01782C10.5623 4.00619 10.6125 4.00062 10.6618 4.00024L10.7448 4.00513ZM3.07874 10.6672H4.66663V7.49048L3.07874 10.6672ZM11.3336 10.6672H12.9215L11.3336 7.49146V10.6672Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M18 3C19.6569 3 21 4.34315 21 6V14C21 15.6569 19.6569 17 18 17H17V18C17 19.5975 15.7513 20.9036 14.1768 20.9951L14 21H6C4.40248 21 3.09636 19.7513 3.00488 18.1768L3 18V10C3 8.40248 4.24866 7.09636 5.82324 7.00488L6 7H7V6C7 4.34315 8.34315 3 10 3H18ZM6 9C5.48716 9 5.0646 9.38645 5.00684 9.88379L5 10V18C5 18.5128 5.38645 18.9354 5.88379 18.9932L6 19H14C14.5128 19 14.9354 18.6135 14.9932 18.1162L15 18V17H10C8.34315 17 7 15.6569 7 14V9H6ZM10 5C9.44772 5 9 5.44772 9 6V14C9 14.5523 9.44772 15 10 15H18C18.5523 15 19 14.5523 19 14V6C19 5.44772 18.5523 5 18 5H10Z"
        fill="currentColor"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M14 2C15.0543 2 15.9177 2.81581 15.9941 3.85059L16 4V6H20C20.5523 6 21 6.44772 21 7C21 7.51284 20.6136 7.9354 20.1162 7.99316L20 8H19.9199L19 19C19 20.5975 17.7513 21.9036 16.1768 21.9951L16 22H8C6.4024 22 5.09608 20.7512 5.00781 19.251L5.00391 19.083L4.08008 8H4C3.44772 8 3 7.55228 3 7C3 6.48716 3.38645 6.0646 3.88379 6.00684L4 6H8V4C8 2.9457 8.81581 2.08229 9.85059 2.00586L10 2H14ZM7 19C7 19.5128 7.38645 19.9354 7.88379 19.9932L8 20H16C16.5155 20 16.94 19.6096 16.9971 19.041L17.0039 18.917L17.9141 8H6.08594L7 19ZM10 10C10.5128 10 10.9354 10.3865 10.9932 10.8838L11 11V17C11 17.5523 10.5523 18 10 18C9.48716 18 9.0646 17.6135 9.00684 17.1162L9 17V11C9 10.4477 9.44772 10 10 10ZM14 10C14.5128 10 14.9354 10.3865 14.9932 10.8838L15 11V17C15 17.5523 14.5523 18 14 18C13.4872 18 13.0646 17.6135 13.0068 17.1162L13 17V11C13 10.4477 13.4477 10 14 10ZM10 6H14V4H10V6Z"
        fill="currentColor"
      />
    </svg>
  )
}

const ITEM_CLASS =
  "flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-[12px] font-semibold whitespace-nowrap hover:bg-neutral-100"

const DIVIDER = <div className="bg-[#e9e9e9] -my-1.5 w-px shrink-0 self-stretch" />

export function GraphicEditorBar({ show, isAi = false, onDuplicate, onDelete }: GraphicEditorBarProps) {
  if (!show) return null

  return (
    // Shared between desktop and mobile like create-omat's EditorBar — the
    // shell scrolls the row and shows its chevrons once it stops fitting.
    <EditorBarShell data-editor-bar="true">
      <>
        {/* Remove Background — label only, like create-omat. Not wired yet. */}
        <button type="button" className={`${ITEM_CLASS} rounded-l-[24px] px-3`}>
          Remove Background
        </button>

        {DIVIDER}

        {/* Shape — not wired yet. */}
        <button type="button" className={ITEM_CLASS}>
          <ShapeIcon />
          Shape
        </button>

        {DIVIDER}

        {/* Effects — not wired yet. */}
        <button type="button" className={ITEM_CLASS}>
          <GrainIcon />
          Effects
        </button>

        {DIVIDER}

        {/* Modify with AI — only for AI-panel artwork (isAiEditable in
            create-omat). Not wired yet. */}
        {isAi && (
          <>
            <button type="button" className={ITEM_CLASS}>
              <AiStarsIcon />
              Modify with AI
            </button>
            {DIVIDER}
          </>
        )}

        {/* Flip — dropdown in create-omat; trigger only for now, not wired. */}
        <button type="button" className={ITEM_CLASS}>
          <FlipIcon />
          Flip
        </button>

        {DIVIDER}

        {/* Duplicate + Delete — icon-only group, the two live actions. */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Duplicate"
            title="Duplicate"
            onClick={onDuplicate}
            className={ITEM_CLASS}
          >
            <CopyIcon />
          </button>
          <button
            type="button"
            aria-label="Delete"
            title="Delete"
            onClick={onDelete}
            className={`${ITEM_CLASS} rounded-r-[24px] text-[#DC2626]`}
          >
            <TrashIcon />
          </button>
        </div>
      </>
    </EditorBarShell>
  )
}
