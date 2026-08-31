import { Composition } from "remotion";
import { SoleiaIntro } from "./compositions/SoleiaIntro";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SoleiaIntro"
        component={SoleiaIntro}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Soleia",
          subtitle: "Creative Sessions",
        }}
      />
    </>
  );
};
