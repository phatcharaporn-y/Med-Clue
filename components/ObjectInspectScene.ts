import Phaser from "phaser";

type SceneOrigin = { x: number; y: number; width: number; height: number };
type InspectSceneData = { objectId?: string; origin?: SceneOrigin };

const vitalReadings = [
  { label: "BT", value: "36.6 °C", color: "#ffd166", offsetY: 0 },
  { label: "BP", value: "138/82", color: "#91e5b2", offsetY: 0.03 },
  { label: "HR", value: "84 bpm", color: "#ff8d83", offsetY: 0.05 },
  { label: "RR", value: "18 /min", color: "#8ed8ff", offsetY: 0.048 },
  { label: "SpO₂", value: "98%", color: "#c8a6ff", offsetY: 0.01 },
];

export class ObjectInspectScene extends Phaser.Scene {
  private objectId = "";
  private origin?: SceneOrigin;
  private doctorPage: 1 | 2 = 1;
  private uiFontFamily = "Arial, sans-serif";
  private countdownVolume = 0.2;
  private hasAnimatedIn = false;
  private isClosing = false;
  private backgroundOverlay?: Phaser.GameObjects.Rectangle;
  private mainVisual?: Phaser.GameObjects.Image;
  private sceneContent: Array<
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha
  > = [];
  private visualTarget?: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  };
  private countdownSound?: Phaser.Sound.BaseSound;
  private countdownStopTimer?: Phaser.Time.TimerEvent;
  private countdownStopTimeout?: number;

  constructor() {
    super("ObjectInspect");
  }

  init(data: InspectSceneData) {
    this.objectId = data.objectId ?? "";
    this.origin = data.origin;
    this.hasAnimatedIn = false;
    this.isClosing = false;
  }

  preload() {
    this.load.image("largeMonitor", "/images/game/monitorbig.png");
    this.load.image("doctorFolder", "/images/game/floder_brown.png");
    this.load.image("pageArrow", "/images/game/arrow.png");
    this.load.audio("inspectIconClick", "/sounds/iconclick.wav");
    this.load.audio("inspectCountdown", "/sounds/countdown-bleeps-.wav");
    this.load.audio("inspectPageFlip", "/sounds/page-flip.wav");
  }

  create() {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.uiFontFamily = `${promptFont}, Arial, sans-serif`;
    this.sound.play("inspectIconClick", { volume: 1 });
    if (this.objectId === "monitor") this.playCountdown();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.stopCountdown, this);
    this.draw();
  }

  private playCountdown() {
    this.countdownSound = this.sound.add("inspectCountdown", { loop: true });
    this.countdownSound.play({ volume: this.countdownVolume, loop: true });
    this.countdownStopTimer = this.time.delayedCall(3500, () => {
      this.stopCountdown();
    });
    this.countdownStopTimeout = window.setTimeout(() => {
      this.stopCountdown();
    }, 3500);
  }

  private stopCountdown() {
    this.countdownStopTimer?.remove(false);
    this.countdownStopTimer = undefined;
    if (this.countdownStopTimeout !== undefined) {
      window.clearTimeout(this.countdownStopTimeout);
      this.countdownStopTimeout = undefined;
    }
    this.sound.stopByKey("inspectCountdown");
    this.countdownSound?.stop();
    this.countdownSound?.destroy();
    this.countdownSound = undefined;
  }

  private draw() {
    if (this.isClosing) return;
    this.children.removeAll(true);
    const { width, height } = this.scale;

    if (this.objectId === "doctor-desk") {
      this.drawDoctorFolder(width, height);
      return;
    }

    const background = this.add
      .rectangle(width / 2, height / 2, width, height, 0x050b0c, 0.72)
      .setDepth(0)
      .setInteractive();
    if (!this.hasAnimatedIn) background.setAlpha(0);

    const isMonitor = this.objectId === "monitor";
    const textureKey = isMonitor ? "largeMonitor" : "doctorFolder";
    const texture = this.textures
      .get(textureKey)
      .getSourceImage() as HTMLImageElement;
    const maxWidth = width * (isMonitor ? 1.04 : 0.82);
    const maxHeight = height * (isMonitor ? 1.02 : 0.84);
    const imageScale = Math.min(
      maxWidth / texture.width,
      maxHeight / texture.height,
    );
    const displayWidth = texture.width * imageScale;
    const displayHeight = texture.height * imageScale;
    const centerX = width / 2;
    const centerY = height / 2;

    const visual = this.add
      .image(centerX, centerY, textureKey)
      .setScale(imageScale)
      .setDepth(1);
    const contentStart = this.children.list.length;

    this.drawVitalReadings(centerX, centerY, displayWidth, displayHeight);
    this.drawBackLabel(
      Math.max(24, width * 0.025),
      Math.max(30, height * 0.045),
    );
    this.animateSceneEntry(
      background,
      visual,
      contentStart,
      imageScale,
      imageScale,
    );
  }

  private drawDoctorFolder(width: number, height: number) {
    const background = this.add
      .rectangle(width / 2, height / 2, width, height, 0x050b0c, 0.72)
      .setDepth(0)
      .setInteractive();
    if (!this.hasAnimatedIn) background.setAlpha(0);

    const folderSource = this.textures
      .get("doctorFolder")
      .getSourceImage() as HTMLImageElement;
    const folderScale = Math.min(
      (width * 0.52) / folderSource.width,
      (height * 1.04) / folderSource.height,
    );
    const folderWidth = folderSource.width * folderScale;
    const folderHeight = folderSource.height * folderScale;
    const centerX = width / 2;
    const centerY = height * 0.48;
    const visual = this.add
      .image(centerX, centerY, "doctorFolder")
      .setScale(folderScale)
      .setDepth(2);
    const contentStart = this.children.list.length;

    if (this.doctorPage === 1)
      this.drawPatientHistory(
        centerX,
        centerY,
        folderWidth,
        folderHeight,
        width,
      );
    else
      this.drawDoctorOrder(centerX, centerY, folderWidth, folderHeight, width);

    this.drawBackLabel(
      Math.max(24, width * 0.025),
      Math.max(30, height * 0.045),
      this.doctorPage === 2 ? "< คำสั่งแพทย์" : "< ข้อมูลผู้ป่วย",
    );

    const arrowX = centerX + folderWidth * 0.35;
    const arrow = this.add
      .image(arrowX, centerY + folderHeight * 0.34, "pageArrow")
      .setScale(
        (folderWidth * 0.18) /
          this.textures.get("pageArrow").getSourceImage().width,
      )
      .setFlipX(this.doctorPage === 2)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    arrow.on("pointerdown", () => {
      this.sound.play("inspectPageFlip", { volume: 2.0 });
      this.doctorPage = this.doctorPage === 1 ? 2 : 1;
      this.draw();
    });
    this.animateSceneEntry(
      background,
      visual,
      contentStart,
      folderScale,
      folderScale,
    );
  }

  private animateSceneEntry(
    background: Phaser.GameObjects.Rectangle,
    visual: Phaser.GameObjects.Image,
    contentStart: number,
    targetScaleX: number,
    targetScaleY: number,
  ) {
    this.backgroundOverlay = background;
    this.mainVisual = visual;
    this.visualTarget = {
      x: visual.x,
      y: visual.y,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
    };
    const content = this.children.list.slice(contentStart) as Array<
      Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha
    >;
    this.sceneContent = content;
    if (this.hasAnimatedIn) return;
    this.hasAnimatedIn = true;

    content.forEach((child) => child.setAlpha(0));

    const target = this.visualTarget;
    if (this.origin) {
      visual.setPosition(this.origin.x, this.origin.y);
      visual.setScale(
        this.origin.width / visual.width,
        this.origin.height / visual.height,
      );
    } else {
      visual.setScale(targetScaleX * 0.84, targetScaleY * 0.84);
    }
    this.tweens.add({
      targets: background,
      alpha: 1,
      duration: 260,
      ease: "Sine.Out",
    });
    this.tweens.add({
      targets: visual,
      x: target.x,
      y: target.y,
      scaleX: target.scaleX,
      scaleY: target.scaleY,
      duration: 460,
      ease: "Back.Out",
    });
    if (content.length) {
      this.tweens.add({
        targets: content,
        alpha: 1,
        delay: 130,
        duration: 260,
        ease: "Sine.Out",
      });
    }
  }

  private drawPatientHistory(
    centerX: number,
    centerY: number,
    folderWidth: number,
    folderHeight: number,
    width: number,
  ) {
    const left = centerX - folderWidth * 0.31;
    const valueX = centerX - folderWidth * 0.13;
    const startY = centerY - folderHeight * 0.34;
    const fontSize = `${Math.max(11, Math.min(18, width * 0.009))}px`;
    this.add
      .text(centerX, startY, "ซักประวัติผู้ป่วย  (1/2)", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(14, Math.min(22, width * 0.011))}px`,
        fontStyle: "bold",
        color: "#25211c",
      })
      .setOrigin(0.5)
      .setDepth(3);

    const rows = [
      ["ผู้ป่วย", "นายธนกฤต วัฒนากุล  68 ปี ชาย  •  HN 69031427"],
      ["แพ้ยา", "ไม่มีประวัติแพ้ยา"],
      ["โรคประจำตัว", "T2DM 10 ปี, HT, Dyslipidemia,\nCKD stage 3"],
      [
        "CBG",
        "แรกรับ 326  •  ก่อนอาหารเช้า 214 mg/dL\n(07:25 น.)  •  HbA1c 9.1%",
      ],
      ["ตรวจร่างกาย", "GCS 15 ไม่มีซึม เหนื่อยออก ใจสั่น\nคลื่นไส้เล็กน้อย"],
    ];
    const rowGap = folderHeight * 0.082;
    rows.forEach(([label, value], index) => {
      const y = startY + folderHeight * 0.075 + index * rowGap;
      this.add
        .text(left, y, label, {
          fontFamily: this.uiFontFamily,
          fontSize,
          fontStyle: "bold",
          color: "#28231e",
        })
        .setDepth(3);
      this.add
        .text(valueX, y, value, {
          fontFamily: this.uiFontFamily,
          fontSize,
          color: "#28231e",
          wordWrap: { width: folderWidth * 0.48 },
          lineSpacing: 4,
        })
        .setDepth(3);
    });
  }

  private drawDoctorOrder(
    centerX: number,
    centerY: number,
    folderWidth: number,
    folderHeight: number,
    width: number,
  ) {
    const left = centerX - folderWidth * 0.31;
    const valueX = centerX + folderWidth * 0.015;
    const startY = centerY - folderHeight * 0.34;
    const fontSize = `${Math.max(10, Math.min(16, width * 0.008))}px`;
    this.add
      .text(centerX, startY, "ซักประวัติผู้ป่วย  (2/2)", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(14, Math.min(22, width * 0.011))}px`,
        fontStyle: "bold",
        color: "#25211c",
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.add
      .text(left, startY + folderHeight * 0.085, "Doctor's Order", {
        fontFamily: this.uiFontFamily,
        fontSize,
        fontStyle: "bold",
        color: "#28231e",
      })
      .setDepth(3);
    this.add
      .text(
        left,
        startY + folderHeight * 0.125,
        "Check CBG AC & HS • Regular insulin U-100\nSC before meals ตาม correction scale\n(ประสานกับอาจารย์)",
        {
          fontFamily: this.uiFontFamily,
          fontSize,
          color: "#28231e",
          wordWrap: { width: folderWidth * 0.66 },
          lineSpacing: 3,
        },
      )
      .setDepth(3);

    const tableY = startY + folderHeight * 0.27;
    this.add
      .text(left, tableY, "CBG (mg/dL)", {
        fontFamily: this.uiFontFamily,
        fontSize,
        fontStyle: "bold",
        color: "#28231e",
      })
      .setDepth(3);
    this.add
      .text(valueX, tableY, "Regular insulin", {
        fontFamily: this.uiFontFamily,
        fontSize,
        fontStyle: "bold",
        color: "#28231e",
      })
      .setDepth(3);
    const orders = [
      ["< 70", "Hold, hypoglycemia protocol, แจ้งแพทย์"],
      ["70–150", "0 unit"],
      ["151–200", "2 units SC"],
      ["201–250", "4 units SC"],
      ["251–300", "6 units SC"],
      ["301–350", "8 units SC"],
      ["> 350", "10 units SC, แจ้งแพทย์"],
    ];
    const rowGap = folderHeight * 0.041;
    orders.forEach(([range, order], index) => {
      const y = tableY + folderHeight * 0.055 + index * rowGap;
      this.add
        .text(left, y, range, {
          fontFamily: this.uiFontFamily,
          fontSize,
          color: "#28231e",
        })
        .setDepth(3);
      this.add
        .text(valueX, y, order, {
          fontFamily: this.uiFontFamily,
          fontSize,
          color: "#28231e",
          wordWrap: { width: folderWidth * 0.42 },
        })
        .setDepth(3);
    });
    this.add
      .text(
        left,
        centerY + folderHeight * 0.31,
        "V/S แรกรับ: BT 36.6, BP 138/82, HR 84, RR 18, SpO₂ 98%",
        {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(9, Math.min(13, width * 0.0065))}px`,
          color: "#28231e",
          wordWrap: { width: folderWidth * 0.67 },
        },
      )
      .setDepth(3);
  }

  private drawVitalReadings(
    centerX: number,
    centerY: number,
    displayWidth: number,
    displayHeight: number,
  ) {
    // This is the blank metrics column on the right side of monitorbig.png.
    const panelX = centerX + displayWidth * 0.2;
    const panelTop = centerY - displayHeight * 0.3;
    const rowGap = displayHeight * 0.1;

    vitalReadings.forEach((reading, index) => {
      const y = panelTop + index * rowGap + displayHeight * reading.offsetY;
      this.add
        .text(panelX, y, reading.label, {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(9, displayHeight * 0.02)}px`,
          fontStyle: "normal",
          color: "#a9c9bd",
        })
        .setOrigin(0.5, 0)
        .setDepth(2);
      this.add
        .text(panelX, y + displayHeight * 0.025, reading.value, {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(11, displayHeight * 0.025)}px`,
          fontStyle: "bold",
          color: reading.color,
          stroke: "#102321",
          strokeThickness: 1.5,
        })
        .setOrigin(0.5, 0)
        .setDepth(2);
    });
  }

  private drawBackLabel(x: number, y: number, text = "< ตรวจสัญญาณชีพ") {
    const label = this.add
      .text(x, y, text, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(18, Math.min(26, this.scale.height * 0.026))}px`,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#171717",
        strokeThickness: 4,
        shadow: {
          color: "#000000",
          blur: 2,
          fill: true,
          stroke: true,
          offsetX: 1,
          offsetY: 2,
        },
      })
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    label.on("pointerdown", () => this.close());
  }

  private close() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.stopCountdown();
    const finish = () => {
      this.scene.stop();
      this.scene.resume("GameRoom");
    };
    const visual = this.mainVisual;
    const target = this.visualTarget;
    if (!visual || !target) {
      finish();
      return;
    }
    const destination = this.origin
      ? {
          x: this.origin.x,
          y: this.origin.y,
          scaleX: this.origin.width / visual.width,
          scaleY: this.origin.height / visual.height,
        }
      : {
          x: target.x,
          y: target.y,
          scaleX: target.scaleX * 0.84,
          scaleY: target.scaleY * 0.84,
        };
    const content = this.sceneContent;
    if (content.length) {
      this.tweens.killTweensOf(content);
      this.tweens.add({
        targets: content,
        alpha: 0,
        duration: 150,
        ease: "Sine.In",
      });
    }
    if (this.backgroundOverlay) {
      this.tweens.killTweensOf(this.backgroundOverlay);
      this.tweens.add({
        targets: this.backgroundOverlay,
        alpha: 0,
        duration: 320,
        ease: "Sine.In",
      });
    }
    this.tweens.killTweensOf(visual);
    this.tweens.add({
      targets: visual,
      ...destination,
      duration: 360,
      ease: "Cubic.In",
      onComplete: finish,
    });
  }
}
