import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type SoleiaIntroProps = {
  title: string;
  subtitle: string;
};

const GOLD = "hsl(43, 55%, 52%)";
const INK = "hsl(30, 12%, 12%)";
const PAPER = "hsl(40, 33%, 96%)";

export const SoleiaIntro = ({ title, subtitle }: SoleiaIntroProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ruleWidth = interpolate(frame, [20, 70], [0, 240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PAPER,
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <h1
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 160,
          fontWeight: 400,
          color: INK,
          margin: 0,
          letterSpacing: "0.02em",
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 60}px)`,
        }}
      >
        {title}
      </h1>
      <div
        style={{
          height: 2,
          width: ruleWidth,
          backgroundColor: GOLD,
          margin: "36px 0",
        }}
      />
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 42,
          color: INK,
          margin: 0,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          opacity: subtitleOpacity,
        }}
      >
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};
