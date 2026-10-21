"use client";

import { useEffect, useRef } from "react";
import styles from "./NursingGame.module.css";

export default function NursingGame() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let game: import("phaser").Game | undefined;

    const launch = async () => {
      await document.fonts.ready;
      const PhaserModule = await import("phaser");
      const { CaseBriefScene } = await import("./CaseBriefScene");
      const { GameRoomScene } = await import("./GameRoomScene");
      const { PatientInteractionScene } = await import("./PatientInteractionScene");
      const { SkinAssessmentScene } = await import("./SkinAssessmentScene");
      const { MedicationPatientFlowScene } = await import("./MedicationPatientFlowScene");
      const { ObjectInspectScene } = await import("./ObjectInspectScene");
      const { MedicationTrayScene } = await import("./MedicationTrayScene");
      const {
        MedicationCabinetScene,
        MedicationSyringesScene,
        MedicationDoseScene,
        MedicationAspirationScene,
      } = await import("./MedicationStepScenes");
      if (disposed || !stageRef.current) return;

      game = new PhaserModule.default.Game({
        type: PhaserModule.AUTO,
        parent: stageRef.current,
        width: 1728,
        height: 1152,
        backgroundColor: "#30221a",
        scale: {
          mode: PhaserModule.Scale.RESIZE,
          autoCenter: PhaserModule.Scale.CENTER_BOTH,
        },
        render: {
          antialias: true,
          pixelArt: false,
          roundPixels: true,
        },
        scene: [CaseBriefScene, GameRoomScene, PatientInteractionScene, SkinAssessmentScene, MedicationPatientFlowScene, ObjectInspectScene, MedicationTrayScene,
          MedicationCabinetScene, MedicationSyringesScene, MedicationDoseScene, MedicationAspirationScene],
      });
    };

    void launch();

    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div ref={stageRef} className={styles.stage} aria-label="ฉากจำลองการพยาบาล" />
    </main>
  );
}
