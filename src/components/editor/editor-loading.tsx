import { useMemo } from "@hooks/useMemo";
import { Ring } from "ldrs/react"

const EditorLoading = () => {
  const { isLoading: isMemoLoading, isRefetching: isMemoRefetching } = useMemo();

  const isLoading = isMemoLoading || isMemoRefetching;

  return (
    <div className={`absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center bg-background/80 z-100 ${isLoading ? "" : "transition duration-300 opacity-0 pointer-events-none"}`}>
      <div className={`transition duration-200 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
        <Ring
          size="28"
          speed="2"
          stroke={3}
          color="var(--color-foreground)"
          bgOpacity={0.2}
        />
      </div>
    </div>
  )
}

export default EditorLoading;