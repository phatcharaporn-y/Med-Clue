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
  private summaryPage: 1 | 2 = 1;
  private activeMARSelect: "medication" | "route" | "site" | null = null;
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
    if (this.objectId === "doctor-desk") this.doctorPage = 1;
    this.summaryPage = 1;
    this.hasAnimatedIn = false;
    this.isClosing = false;
    this.activeMARSelect = null;
  }

  preload() {
    this.load.image("largeMonitor", "/images/game/monitorbig.png");
    this.load.image("doctorFolder", "/images/game/floder_brown.png");
    this.load.image("marFolder", "/images/game/floder_blue.png");
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

    const isAfterAdministration = Boolean(
      this.registry.get("patientMedicationAdministered"),
    );
    const savedRecord = this.registry.get("medicationAdministrationRecord");
    const folderTexture = isAfterAdministration ? "marFolder" : "doctorFolder";
    const doctorFolderSource = this.textures
      .get("doctorFolder")
      .getSourceImage() as HTMLImageElement;
    const folderSource = this.textures
      .get(folderTexture)
      .getSourceImage() as HTMLImageElement;
    const doctorFolderScale = Math.min(
      (width * 0.52) / doctorFolderSource.width,
      (height * 1.04) / doctorFolderSource.height,
    );
    const doctorFolderWidth = doctorFolderSource.width * doctorFolderScale;
    const folderScale = isAfterAdministration
      ? Math.min(
          (width * 0.52) / folderSource.width,
          (height * 1.04) / folderSource.height,
          doctorFolderWidth / folderSource.width,
        )
      : doctorFolderScale;
    const folderWidth = folderSource.width * folderScale;
    const folderHeight = folderSource.height * folderScale;
    const centerX = width / 2;
    const centerY = height * 0.48;
    const visual = this.add
      .image(centerX, centerY, folderTexture)
      .setScale(folderScale)
      .setDepth(2);
    const contentStart = this.children.list.length;

    if (isAfterAdministration) {
      if (savedRecord) {
        this.drawMARSummary(centerX, centerY, folderWidth, folderHeight, width, savedRecord);
      } else {
        this.drawMARForm(centerX, centerY, folderWidth, folderHeight, width);
      }
      this.drawBackLabel(
        Math.max(24, width * 0.025),
        Math.max(30, height * 0.045),
        "< กลับห้องผู้ป่วย",
      );
    } else if (this.doctorPage === 1) {
      this.drawPatientHistory(
        centerX,
        centerY,
        folderWidth,
        folderHeight,
        width,
      );
    } else {
      this.drawDoctorOrder(centerX, centerY, folderWidth, folderHeight, width);
    }

    if (!isAfterAdministration) {
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
    } else if (savedRecord) {
      const arrowX = centerX + folderWidth * 0.35;
      const arrow = this.add
        .image(arrowX, centerY + folderHeight * 0.34, "pageArrow")
        .setScale(
          (folderWidth * 0.18) /
            this.textures.get("pageArrow").getSourceImage().width,
        )
        .setFlipX(this.summaryPage === 2)
        .setDepth(5)
        .setInteractive({ useHandCursor: true });
      arrow.on("pointerdown", () => {
        this.sound.play("inspectPageFlip", { volume: 2.0 });
        this.summaryPage = this.summaryPage === 1 ? 2 : 1;
        this.draw();
      });
    }
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

  private getMARDraft() {
    const savedDraft = this.registry.get("medicationAdministrationDraft");
    if (savedDraft) return savedDraft;

    const preparation = this.registry.get("medicationPreparation") ?? {};
    const bottleNames = [
      "Regular insulin U-100",
      "Insulin glargine U-100",
      "NPH insulin U-100",
    ];
    const injectionSite = this.registry.get("patientInjectionSite");
    return {
      medication: bottleNames[preparation.medicineBottle ?? 0] ?? bottleNames[0],
      dose: preparation.calculatedDose ?? 4,
      route: "SC",
      site: injectionSite?.label ?? "หน้าท้องขวา",
      time: "07:30",
    };
  }

  private drawMARForm(
    centerX: number,
    centerY: number,
    folderWidth: number,
    folderHeight: number,
    width: number,
  ) {
    const draft = this.getMARDraft();
    const fontSize = `${Math.max(10, Math.min(16, width * 0.008))}px`;
    const headingSize = `${Math.max(14, Math.min(22, width * 0.011))}px`;
    const left = centerX - folderWidth * 0.31;
    const valueX = centerX + folderWidth * 0.015;
    const titleY = centerY - folderHeight * 0.34;

    this.add
      .text(centerX, titleY, "MAR  /  eMAR", {
        fontFamily: this.uiFontFamily,
        fontSize: headingSize,
        fontStyle: "bold",
        color: "#25211c",
      })
      .setOrigin(0.5)
      .setDepth(3);

    const details = [
      ["ยา", "Regular insulin U-100 SC ตาม correction scale"],
      ["เวลา", "ก่อนอาหาร  เช้า 07:30  ·  กลางวัน 11:30  ·  เย็น 16:30"],
      ["ระวัง", "ตรวจ CBG, อาการ hypoglycemia, ความพร้อมรับประทานอาหาร และตำแหน่งฉีด"],
    ];
    details.forEach(([label, value], index) => {
      const y = centerY - folderHeight * 0.25 + index * folderHeight * 0.082;
      this.add
        .text(left, y, label, {
          fontFamily: this.uiFontFamily,
          fontSize,
          fontStyle: "bold",
          color: "#28231e",
        })
        .setDepth(3);
      this.add
        .text(left + folderWidth * 0.095, y, value, {
          fontFamily: this.uiFontFamily,
          fontSize,
          color: "#28231e",
          wordWrap: { width: folderWidth * 0.66 },
          lineSpacing: 3,
        })
        .setDepth(3);
    });

    const formTitleY = centerY + folderHeight * 0.015;
    this.add
      .text(left, formTitleY, "บันทึกการให้ยา", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(14, Math.min(22, width * 0.011))}px`,
        fontStyle: "bold",
        color: "#25211c",
      })
      .setOrigin(0, 0.5)
      .setDepth(3);

    const formWidth = folderWidth * 0.72;
    const gap = formWidth * 0.025;
    const fieldHeight = Math.max(38, Math.min(56, folderHeight * 0.052));
    const firstY = formTitleY + folderHeight * 0.082;
    const medWidth = formWidth * 0.44;
    const doseWidth = formWidth * 0.22;
    const routeWidth = formWidth - medWidth - doseWidth - gap * 2;
    const fieldFontSize = `${Math.max(10, Math.min(16, width * 0.008))}px`;

    const drawField = (
      x: number,
      y: number,
      fieldWidth: number,
      value: string,
      onClick?: () => void,
    ) => {
      const field = this.add
        .rectangle(x, y, fieldWidth, fieldHeight, 0xfffcf5)
        .setStrokeStyle(2, 0x3b342d)
        .setDepth(4);
      const label = this.add
        .text(x - fieldWidth / 2 + 10, y, value, {
          fontFamily: this.uiFontFamily,
          fontSize: fieldFontSize,
          color: "#39332d",
          wordWrap: { width: fieldWidth - 28 },
        })
        .setOrigin(0, 0.5)
        .setDepth(5);
      if (onClick) {
        field.setInteractive({ useHandCursor: true }).on("pointerdown", onClick);
        label.setInteractive({ useHandCursor: true }).on("pointerdown", onClick);
        this.add
          .text(x + fieldWidth / 2 - 12, y, "⌄", {
            fontFamily: "Arial, sans-serif",
            fontSize: fieldFontSize,
            color: "#29251f",
          })
          .setOrigin(0.5)
          .setDepth(5)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", onClick);
      }
    };

    let fieldX = centerX - formWidth / 2 + medWidth / 2;
    drawField(fieldX, firstY, medWidth, draft.medication, () => {
      this.activeMARSelect = this.activeMARSelect === "medication" ? null : "medication";
      this.draw();
    });
    const medicationOptions = [
      "Regular insulin U-100",
      "Insulin glargine U-100",
      "NPH insulin U-100",
    ];
    const medicationFieldX = fieldX;
    fieldX += medWidth / 2 + gap + doseWidth / 2;
    drawField(fieldX, firstY, doseWidth, `${draft.dose} units`);
    const stepSize = Math.max(24, fieldHeight * 0.55);
    [
      { delta: 1, label: "▲" },
      { delta: -1, label: "▼" },
    ].forEach(({ delta, label }, index) => {
      const controlX = fieldX + doseWidth / 2 - 12;
      const controlY = firstY + (index === 0 ? -stepSize / 2 : stepSize / 2);
      this.add
        .text(controlX, controlY, label, {
          fontFamily: "Arial, sans-serif",
          fontSize: `${Math.max(16, fieldHeight * 0.42)}px`,
          fontStyle: "bold",
          color: "#29251f",
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.saveMARField({ dose: Math.max(0, draft.dose + delta) });
        });
    });
    fieldX += doseWidth / 2 + gap + routeWidth / 2;
    drawField(fieldX, firstY, routeWidth, draft.route, () => {
      this.activeMARSelect = this.activeMARSelect === "route" ? null : "route";
      this.draw();
    });
    const routeFieldX = fieldX;

    const siteWidth = Math.min(formWidth * 0.48, folderWidth * 0.4);
    const siteY = firstY + fieldHeight * 1.55;
    const siteFieldX = centerX - formWidth / 2 + siteWidth / 2;
    drawField(siteFieldX, siteY, siteWidth, draft.site, () => {
      this.activeMARSelect = this.activeMARSelect === "site" ? null : "site";
      this.draw();
    });
    const siteOptions = [
      "ต้นแขนซ้าย",
      "ต้นแขนขวา",
      "หน้าท้องซ้าย",
      "หน้าท้องขวา",
      "ต้นขาขวา",
      "ต้นขาซ้าย",
    ];

    this.drawMARSelectOptions(
      "medication",
      medicationFieldX,
      firstY,
      medWidth,
      fieldHeight,
      medicationOptions,
      "medication",
    );
    this.drawMARSelectOptions(
      "route",
      routeFieldX,
      firstY,
      routeWidth,
      fieldHeight,
      ["SC", "IM", "IV"],
      "route",
    );
    this.drawMARSelectOptions(
      "site",
      siteFieldX,
      siteY,
      siteWidth,
      fieldHeight,
      siteOptions,
      "site",
    );

    const buttonY = Math.min(
      centerY + folderHeight * 0.35,
      this.scale.height - Math.max(34, folderHeight * 0.055),
    );
    this.drawMARButton(centerX, buttonY, Math.min(formWidth * 0.48, 300), "บันทึก", () => {
      this.registry.set("medicationAdministrationRecord", {
        ...this.getMARDraft(),
        savedAt: new Date().toISOString(),
      });
      this.sound.play("inspectIconClick", { volume: 0.8 });
      this.draw();
    });
  }

  private saveMARField(update: Record<string, string | number>) {
    this.registry.set("medicationAdministrationDraft", {
      ...this.getMARDraft(),
      ...update,
    });
    this.sound.play("inspectIconClick", { volume: 0.65 });
    this.draw();
  }

  private drawMARSelectOptions(
    active: "medication" | "route" | "site",
    x: number,
    y: number,
    fieldWidth: number,
    fieldHeight: number,
    options: string[],
    key: "medication" | "route" | "site",
  ) {
    if (this.activeMARSelect !== active) return;
    const rowHeight = Math.max(32, fieldHeight * 0.82);
    const menuHeight = options.length * rowHeight;
    const menuTop = y - fieldHeight / 2 - menuHeight;
    options.forEach((option, index) => {
      const optionY = menuTop + rowHeight * (index + 0.5);
      const row = this.add
        .rectangle(x, optionY, fieldWidth, rowHeight, 0xfffcf5)
        .setStrokeStyle(1, 0x78664f)
        .setDepth(14)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x - fieldWidth / 2 + 10, optionY, option, {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(10, Math.min(16, this.scale.width * 0.008))}px`,
          color: "#302820",
          wordWrap: { width: fieldWidth - 20 },
        })
        .setOrigin(0, 0.5)
        .setDepth(15);
      const selectOption = () => {
        this.activeMARSelect = null;
        this.saveMARField({ [key]: option });
      };
      row.on("pointerdown", selectOption);
      label.setInteractive({ useHandCursor: true }).on("pointerdown", selectOption);
    });
  }

  private drawMARSummary(
    centerX: number,
    centerY: number,
    folderWidth: number,
    folderHeight: number,
    width: number,
    record: { medication: string; dose: number; route: string; site: string; time?: string },
  ) {
    const titleSize = `${Math.max(14, Math.min(22, width * 0.011))}px`;
    const fontSize = `${Math.max(10, Math.min(16, width * 0.008))}px`;
    const rounds = this.registry.get("patientConversationRounds") ?? {};
    const skinAssessment = this.registry.get("patientSkinAssessment") ?? {};
    const preparation = this.registry.get("medicationPreparation") ?? {};
    const beforeTopics = rounds.beforeMedicationTopics ?? [];
    const patientVerified = beforeTopics.some((topic: { id: string }) => topic.id === "identity") &&
      beforeTopics.some((topic: { id: string }) => topic.id === "wristband");
    const rights: Array<[string, number | null]> = [
      ["Right patient", rounds.beforeMedicationCompleted ? (patientVerified ? 100 : 0) : null],
      ["Right drug", preparation.medicineSelected ? (this.registry.get("patientMedicationAdministered") && preparation.medicineBottle === 0 && record.medication === "Regular insulin U-100" ? 100 : 0) : null],
      ["Right dose", preparation.doseCalculated ? (preparation.calculatedDose !== null && Number(record.dose) === Number(preparation.calculatedDose) ? 100 : 0) : null],
      ["Right route (SC)", record.route ? (record.route === "SC" ? 100 : 0) : null],
      ["Right time", record.time ? 100 : null],
      ["Right documentation", this.registry.get("medicationAdministrationRecord") ? 100 : null],
      ["Right history & assessment", rounds.initialInterviewCompleted || skinAssessment.completed ? (rounds.initialInterviewCompleted && skinAssessment.completed ? 100 : 0) : null],
      ["Right education", rounds.beforeMedicationCompleted ? 100 : null],
      ["Right evaluation/response", rounds.postMedicationCompleted ? 100 : null],
      ["Right to refuse (เปิดโอกาสซักถาม)", typeof rounds.rightToRefuseCompleted === "boolean" ? (rounds.rightToRefuseCompleted ? 100 : 0) : null],
    ];
    const passedRights = rights.filter(([, percent]) => percent === 100).length;
    const checkedRights = rights.filter(([, percent]) => percent !== null).length;

    this.add
      .text(centerX, centerY - folderHeight * 0.34, "Summary", {
        fontFamily: this.uiFontFamily,
        fontSize: titleSize,
        fontStyle: "bold",
        color: "#25211c",
      })
      .setOrigin(0.5)
      .setDepth(3);
    if (this.summaryPage === 1) {
      const status = checkedRights === 10 && passedRights === 10
        ? "ผ่านเกณฑ์ ✓"
        : `มีข้อมูลยืนยัน ${checkedRights} / 10 ข้อ`;
      this.add
        .text(centerX, centerY - folderHeight * 0.215, status, {
          fontFamily: this.uiFontFamily,
          fontSize,
          fontStyle: "bold",
          color: "#25211c",
        })
        .setOrigin(0.5)
        .setDepth(3);
      this.add
        .text(centerX, centerY - folderHeight * 0.27, `${passedRights}/10`, {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(28, Math.min(46, width * 0.027))}px`,
          fontStyle: "bold",
          color: "#25211c",
        })
        .setOrigin(0.5)
        .setDepth(3);

      const left = centerX - folderWidth * 0.31;
      const percentX = centerX + folderWidth * 0.32;
      rights.forEach(([label, percent], index) => {
        const y = centerY - folderHeight * 0.145 + index * folderHeight * 0.047;
        this.add
          .text(left, y, label, {
            fontFamily: this.uiFontFamily,
            fontSize,
            color: "#28231e",
            wordWrap: { width: folderWidth * 0.6 },
          })
          .setDepth(3);
        this.add
          .text(percentX, y, percent === null ? "—" : `${percent}%`, {
            fontFamily: this.uiFontFamily,
            fontSize,
            color: "#28231e",
          })
          .setOrigin(1, 0)
          .setDepth(3);
      });
    } else {
      this.add
        .text(centerX, centerY - folderHeight * 0.285, "รายละเอียดผลการดูแล", {
          fontFamily: this.uiFontFamily,
          fontSize,
          fontStyle: "bold",
          color: "#25211c",
        })
        .setOrigin(0.5)
        .setDepth(3);

      const left = centerX - folderWidth * 0.27;
      const valueX = centerX + folderWidth * 0.055;
      const errorRows = this.registry.get("medicationErrors") ?? [];
      const initialAnswers = rounds.initialInterviewAnswers ?? [];
      const postAnswers = rounds.postMedicationAnswers ?? [];
      const injectionSite = this.registry.get("patientInjectionSite");
      const requiredBeforeTopics = (rounds.beforeMedicationTopics ?? []).filter((topic: { required?: boolean }) => topic.required);
      const correctBeforeTopics = requiredBeforeTopics.filter((topic: { score?: number }) => topic.score === 25).length;
      const countCorrectAnswers = (answers: Array<{ score?: number; maxScore?: number }>) =>
        `${answers.filter((answer) => answer.maxScore != null && answer.score === answer.maxScore).length} / ${answers.length} ข้อ`;
      const medicationPreparationResult = (condition: boolean, completed: boolean) =>
        completed ? (condition ? "ถูกต้อง" : "ไม่ถูกต้อง") : "ยังไม่มีผล";
      const medicationRightFailures = rights
        .filter(([label, percent]) =>
          ["Right drug", "Right dose", "Right route (SC)", "Right time"].includes(label) &&
          percent === 0,
        )
        .map(([label]) => label);
      const details: Array<[string, string]> = [
        ["Medication Errors", errorRows.length || medicationRightFailures.length ? `${errorRows.length + medicationRightFailures.length} รายการ` : "ยังไม่มีข้อมูลบันทึกข้อผิดพลาด"],
        ...(medicationRightFailures.length
          ? [["รายการที่ต้องทบทวน", medicationRightFailures.join(" · ")] as [string, string]]
          : []),
        ["เลือกขวดยา", medicationPreparationResult(preparation.medicineBottle === 0, preparation.medicineSelected)],
        ["เลือกไซริง", medicationPreparationResult(preparation.syringeSelected === 0, preparation.syringeSelected != null)],
        ["คำนวณโดส 4 ยูนิต", medicationPreparationResult(Number(preparation.calculatedDose) === 4, preparation.doseCalculated)],
        ["ซักประวัติผู้ป่วย", rounds.initialInterviewCompleted ? countCorrectAnswers(initialAnswers) : "ยังไม่มีผล"],
        ["สื่อสารก่อนให้ยา", rounds.beforeMedicationCompleted ? `${correctBeforeTopics} / ${requiredBeforeTopics.length} ข้อ` : "ยังไม่มีผล"],
        ["ตรวจสภาพผิว", skinAssessment.completed ? (injectionSite?.id === "right-thigh" ? "เลือกตำแหน่งถูกต้อง" : "เลือกตำแหน่งไม่ถูกต้อง") : "ยังไม่มีผลตรวจ"],
        ["ติดตามหลังให้ยา", rounds.postMedicationCompleted ? countCorrectAnswers(postAnswers) : "ยังไม่มีผล"],
      ];
      details.forEach(([label, value], index) => {
        const y = centerY - folderHeight * 0.17 + index * folderHeight * 0.075;
        this.add
          .text(left, y, label, {
            fontFamily: this.uiFontFamily,
            fontSize,
            fontStyle: index === 0 ? "bold" : "normal",
            color: "#28231e",
          })
          .setDepth(3);
        this.add
          .text(valueX, y, value, {
            fontFamily: this.uiFontFamily,
            fontSize,
            color: "#28231e",
            wordWrap: { width: folderWidth * 0.48 },
            lineSpacing: 3,
          })
          .setDepth(3);
      });
    }

    const buttonHeight = Math.max(50, Math.min(68, this.scale.height * 0.062));
    const buttonWidth = Math.min(290, Math.max(170, this.scale.width * 0.33));
    const rightX = this.scale.width - buttonWidth / 2 - Math.max(14, this.scale.width * 0.025);
    const replayY = this.scale.height - buttonHeight / 2 - Math.max(24, this.scale.height * 0.045);
    const homeY = replayY - buttonHeight - Math.max(10, this.scale.height * 0.015);
    this.drawMARButton(
      rightX,
      homeY,
      buttonWidth,
      "กลับหน้าโฮม",
      () => {
        sessionStorage.removeItem("medclue-game-scene");
        window.location.assign("/");
      },
    );
    this.drawMARButton(
      rightX,
      replayY,
      buttonWidth,
      "เล่นอีกครั้ง",
      () => {
        sessionStorage.setItem("medclue-game-scene", "GameRoom");
        window.location.assign("/game");
      },
      false,
    );
  }

  private drawMARButton(
    x: number,
    y: number,
    buttonWidth: number,
    label: string,
    action: () => void,
    primary = true,
  ) {
    const buttonHeight = Math.max(50, Math.min(68, this.scale.height * 0.062));
    const shadow = this.add
      .rectangle(x, y + 3, buttonWidth, buttonHeight, primary ? 0x3f2523 : 0x554f47)
      .setDepth(7);
    const face = this.add
      .rectangle(x, y, buttonWidth, buttonHeight, primary ? 0x754444 : 0xfffcf5)
      .setStrokeStyle(1.5, primary ? 0x3f2523 : 0x49392c)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(10, Math.min(16, this.scale.width * 0.008))}px`,
        fontStyle: "bold",
        color: primary ? "#ffffff" : "#28231e",
      })
      .setOrigin(0.5)
      .setDepth(9);
    face.on("pointerover", () => {
      face.setFillStyle(primary ? 0x875252 : 0xeee5d6);
      this.tweens.add({ targets: [face, text], y: y - 2, duration: 120 });
      this.tweens.add({ targets: shadow, y: y + 1, duration: 120 });
    });
    face.on("pointerout", () => {
      face.setFillStyle(primary ? 0x754444 : 0xfffcf5);
      this.tweens.add({ targets: [face, text], y, duration: 120 });
      this.tweens.add({ targets: shadow, y: y + 3, duration: 120 });
    });
    face.on("pointerdown", action);
    text.setInteractive({ useHandCursor: true }).on("pointerdown", action);
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
