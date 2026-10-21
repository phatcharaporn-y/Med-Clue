import Phaser from "phaser";

type CabinetPage = "cabinet" | "needles" | "dose" | "syringe";
type MedicationPreparation = {
  medicineSelected: boolean;
  syringeSelected: number | null;
  glucose: number;
  calculatedDose: number | null;
  doseCalculated: boolean;
  aspirated: boolean;
  aspirationStep: number;
};

const initialPreparation: MedicationPreparation = {
  medicineSelected: false,
  syringeSelected: null,
  glucose: 214,
  calculatedDose: null,
  doseCalculated: false,
  aspirated: false,
  aspirationStep: 0,
};

const syringeNames = ["ไซริงชุดที่ 1", "ไซริงชุดที่ 2", "ไซริงชุดที่ 3"];
const syringeFrames = ["cabinetF1", "cabinetF2", "cabinetF3", "cabinetF4"];

export class MedicationCabinetScene extends Phaser.Scene {
  private page: CabinetPage = "cabinet";
  private uiFontFamily = "Arial, sans-serif";
  private preparation: MedicationPreparation = { ...initialPreparation };
  private notice?: Phaser.GameObjects.Text;

  constructor() {
    super("MedicationCabinet");
  }

  init(data: { page?: CabinetPage } = {}) {
    this.page = data.page ?? "cabinet";
    this.preparation = this.registry.get("medicationPreparation") ?? {
      ...initialPreparation,
    };
  }

  preload() {
    this.load.image("medicineFridge", "/images/game/refige.png");
    this.load.image("regularInsulinVial", "/images/game/cream.png");
    this.load.image("cabinetSyringe", "/images/game/kem.png");
    this.load.image("cabinetF1", "/images/game/f1.png");
    this.load.image("cabinetF2", "/images/game/f2.png");
    this.load.image("cabinetF3", "/images/game/f3.png");
    this.load.image("cabinetF4", "/images/game/f4.png");
    this.load.image("doseCalculator", "/images/game/dosecal.png");
    this.load.image("doseCalculatorHover", "/images/game/dosecal_hover.png");
    this.load.audio("cabinetDoorSound", "/sounds/door-hard-shut.wav");
    this.load.audio("cabinetGlassSound", "/sounds/glass-hitting.wav");
    this.load.audio("cabinetClickSound", "/sounds/interface-click.wav");
  }

  create() {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.uiFontFamily = `${promptFont}, Arial, sans-serif`;
    this.scale.on(Phaser.Scale.Events.RESIZE, this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.draw, this);
    });
    this.draw();
  }

  private draw() {
    this.children.removeAll(true);
    this.notice = undefined;
    const { width, height } = this.scale;
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x091216, 0.93)
      .setDepth(0);
    this.drawBackLabel(
      Math.max(24, width * 0.025),
      Math.max(30, height * 0.045),
    );
    this.drawProgress(width, height);

    if (this.page === "cabinet") this.drawCabinet(width, height);
    if (this.page === "needles") this.drawNeedleSelection(width, height);
    if (this.page === "dose") this.drawDoseCalculator(width, height);
    if (this.page === "syringe") this.drawAspiration(width, height);
  }

  private drawBackLabel(x: number, y: number) {
    this.add
      .text(x, y, "< เตรียมยา", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(18, Math.min(26, this.scale.height * 0.026))}px`,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#05090b",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.close());
  }

  private drawProgress(width: number, height: number) {
    const steps: Array<{
      page: CabinetPage;
      label: string;
      complete: boolean;
    }> = [
      {
        page: "cabinet",
        label: "1  ยา",
        complete: this.preparation.medicineSelected,
      },
      {
        page: "needles",
        label: "2  ไซริง",
        complete: this.preparation.syringeSelected !== null,
      },
      {
        page: "dose",
        label: "3  คำนวณโดส",
        complete: this.preparation.doseCalculated,
      },
      {
        page: "syringe",
        label: "4  ดูดยา",
        complete: this.preparation.aspirated,
      },
    ];
    const buttonWidth = Math.min(width * 0.17, 225);
    const gap = Math.max(7, width * 0.012);
    const totalWidth = steps.length * buttonWidth + (steps.length - 1) * gap;
    const startX = width / 2 - totalWidth / 2 + buttonWidth / 2;
    const y = height * 0.09;

    steps.forEach((step, index) => {
      const x = startX + index * (buttonWidth + gap);
      const active = this.page === step.page;
      const allowed =
        step.page === "dose"
          ? this.canCalculate()
          : step.page === "syringe"
            ? this.canAspirate()
            : true;
      const fill = active ? 0xb5d5d8 : step.complete ? 0x54766f : 0x27373b;
      const textColor = active ? "#17262a" : allowed ? "#f2e9d8" : "#8b9897";
      const button = this.add
        .rectangle(x, y, buttonWidth, Math.max(34, height * 0.045), fill, 0.96)
        .setStrokeStyle(active ? 2 : 1, active ? 0xf0d9a6 : 0x65716f)
        .setDepth(5);
      const label = this.add
        .text(x, y, `${step.label}${step.complete ? "  ✓" : ""}`, {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(12, Math.min(17, height * 0.016))}px`,
          fontStyle: active ? "bold" : "normal",
          color: textColor,
        })
        .setOrigin(0.5)
        .setDepth(6);
      if (!allowed) {
        button.setAlpha(0.6);
        label.setAlpha(0.72);
      }
      button.setInteractive({ useHandCursor: allowed });
      button.on("pointerdown", () => {
        if (!allowed) {
          this.showNotice(
            step.page === "dose"
              ? "เลือกยาและไซริงก่อน จึงจะคำนวณโดสได้"
              : this.aspirationBlockMessage(),
          );
          return;
        }
        this.page = step.page;
        this.draw();
      });
      label.setInteractive({ useHandCursor: allowed }).on("pointerdown", () => {
        if (!allowed) {
          this.showNotice(
            step.page === "dose"
              ? "เลือกยาและไซริงก่อน จึงจะคำนวณโดสได้"
              : this.aspirationBlockMessage(),
          );
          return;
        }
        this.page = step.page;
        this.draw();
      });
    });
  }

  private drawCabinet(width: number, height: number) {
    this.add
      .text(width / 2, height * 0.19, "ตู้เก็บยา", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(24, Math.min(38, height * 0.034))}px`,
        fontStyle: "bold",
        color: "#f2ead9",
      })
      .setOrigin(0.5)
      .setDepth(3);

    const source = this.textures
      .get("medicineFridge")
      .getSourceImage() as HTMLImageElement;
    const fridgeScale = Math.min(
      (width * 0.49) / source.width,
      (height * 0.68) / source.height,
    );
    const fridgeWidth = source.width * fridgeScale;
    const fridgeHeight = source.height * fridgeScale;
    const fridgeX = width * 0.36;
    const fridgeY = height * 0.58;
    this.add
      .image(fridgeX, fridgeY, "medicineFridge")
      .setScale(fridgeScale)
      .setDepth(2);

    const vialScale = Math.min(
      (fridgeHeight * 0.13) /
        this.textures.get("regularInsulinVial").getSourceImage().height,
      (fridgeWidth * 0.12) /
        this.textures.get("regularInsulinVial").getSourceImage().width,
    );
    const vialX = fridgeX - fridgeWidth * 0.02;
    const vialY = fridgeY - fridgeHeight * 0.12;
    const vial = this.add
      .image(vialX, vialY, "regularInsulinVial")
      .setScale(vialScale)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    vial.on("pointerover", () => vial.setScale(vialScale * 1.08));
    vial.on("pointerout", () => vial.setScale(vialScale));
    vial.on("pointerdown", () => this.selectMedicine());
    this.add
      .text(vialX, vialY + vial.displayHeight * 0.62, "Regular Insulin U-100", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(11, Math.min(17, height * 0.015))}px`,
        fontStyle: "bold",
        color: "#162328",
        backgroundColor: "#f4eddd",
        padding: { x: 7, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(5);

    if (this.preparation.medicineSelected) {
      this.add
        .text(
          vialX + vial.displayWidth * 0.42,
          vialY - vial.displayHeight * 0.42,
          "✓",
          {
            fontFamily: "Arial, sans-serif",
            fontSize: "28px",
            fontStyle: "bold",
            color: "#2b7d61",
            stroke: "#ffffff",
            strokeThickness: 3,
          },
        )
        .setOrigin(0.5)
        .setDepth(6);
    }

    const panelX = width * 0.77;
    const panelY = height * 0.57;
    const panelWidth = Math.min(width * 0.28, 390);
    const panelHeight = Math.min(height * 0.39, 390);
    this.drawInfoPanel(panelX, panelY, panelWidth, panelHeight);
    this.add
      .text(panelX, panelY - panelHeight * 0.28, "เลือกยาตามคำสั่งแพทย์", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(15, height * 0.019)}px`,
        fontStyle: "bold",
        color: "#243238",
        align: "center",
        wordWrap: { width: panelWidth * 0.82 },
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(panelX, panelY - panelHeight * 0.02, "Regular Insulin U-100", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(14, height * 0.017)}px`,
        color: "#354c4c",
        align: "center",
        wordWrap: { width: panelWidth * 0.82 },
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(
        panelX,
        panelY + panelHeight * 0.15,
        this.preparation.medicineSelected
          ? "เลือกยาแล้ว ✓"
          : "คลิกขวดยาบนชั้นเพื่อเลือก",
        {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(12, height * 0.014)}px`,
          color: this.preparation.medicineSelected ? "#2b7d61" : "#6a6f6b",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
    this.addButton(
      "เลือกไซริง  ›",
      panelX,
      panelY + panelHeight * 0.34,
      panelWidth * 0.72,
      Math.max(42, height * 0.055),
      () => this.navigate("needles"),
    );
  }

  private drawNeedleSelection(width: number, height: number) {
    this.drawPageTitle(
      width,
      height,
      "เลือกไซริง / เข็ม",
      "แตะเลือกอุปกรณ์ที่ต้องการใช้",
    );
    const cardWidth = Math.min(width * 0.25, 360);
    const cardHeight = Math.min(height * 0.43, 330);
    const gap = width * 0.035;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = width / 2 - totalWidth / 2 + cardWidth / 2;
    const image = this.textures
      .get("cabinetSyringe")
      .getSourceImage() as HTMLImageElement;

    syringeNames.forEach((name, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = height * 0.53;
      const selected = this.preparation.syringeSelected === index;
      this.drawInfoPanel(
        x,
        y,
        cardWidth,
        cardHeight,
        selected ? 0xcedbd5 : 0xf2ebdc,
      );
      const fitScale = Math.min(
        (cardWidth * 0.86) / image.width,
        (cardHeight * 0.42) / image.height,
      );
      const syringe = this.add
        .image(x, y - cardHeight * 0.1, "cabinetSyringe")
        .setScale(fitScale)
        .setDepth(5);
      syringe
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.selectSyringe(index));
      this.add
        .text(x, y + cardHeight * 0.2, name, {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(14, height * 0.017)}px`,
          fontStyle: "bold",
          color: "#27363a",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(6);
      this.add
        .text(
          x,
          y + cardHeight * 0.31,
          selected ? "เลือกแล้ว ✓" : "แตะเพื่อเลือก",
          {
            fontFamily: this.uiFontFamily,
            fontSize: `${Math.max(11, height * 0.013)}px`,
            color: selected ? "#2b7d61" : "#67716e",
            align: "center",
          },
        )
        .setOrigin(0.5)
        .setDepth(6);
      this.add
        .rectangle(x, y, cardWidth, cardHeight, 0xffffff, 0)
        .setDepth(8)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.selectSyringe(index));
    });

    this.add
      .text(
        width / 2,
        height * 0.82,
        this.preparation.syringeSelected === null
          ? "ยังไม่ได้เลือกไซริง"
          : `เลือกแล้ว: ${syringeNames[this.preparation.syringeSelected]}`,
        {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(13, height * 0.015)}px`,
          color: "#f2ead9",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
    this.addButton(
      "ไปคำนวณโดส  ›",
      width * 0.76,
      height * 0.9,
      Math.min(width * 0.24, 310),
      Math.max(42, height * 0.055),
      () => this.navigate("dose"),
    );
  }

  private drawDoseCalculator(width: number, height: number) {
    this.drawPageTitle(
      width,
      height,
      "คำนวณขนาดยา",
      "ใช้ค่า CBG และ correction scale ตามคำสั่งแพทย์",
    );
    const source = this.textures
      .get("doseCalculator")
      .getSourceImage() as HTMLImageElement;
    const calcScale = Math.min(
      (width * 0.59) / source.width,
      (height * 0.42) / source.height,
    );
    const calcWidth = source.width * calcScale;
    const calcHeight = source.height * calcScale;
    const calcX = width * 0.55;
    const calcY = height * 0.51;
    const calculator = this.add
      .image(calcX, calcY, "doseCalculator")
      .setScale(calcScale)
      .setDepth(3);
    calculator
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => calculator.setTexture("doseCalculatorHover"))
      .on("pointerout", () => calculator.setTexture("doseCalculator"));

    const displayX = calcX - calcWidth * 0.18;
    const displayY = calcY;
    this.add
      .text(displayX, displayY - calcHeight * 0.13, "CBG  •  mg/dL", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(12, height * 0.016)}px`,
        color: "#c7d4cc",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(displayX, displayY - calcHeight * 0.055, "ปรับครั้งละ 1 mg/dL", {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(9, height * 0.011)}px`,
        color: "#aebeb6",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(
        displayX,
        displayY + calcHeight * 0.015,
        `${this.preparation.glucose}`,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: `${Math.max(31, height * 0.052)}px`,
          fontStyle: "bold",
          color: "#f0f2cf",
          stroke: "#101713",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
    const resultText = !this.preparation.doseCalculated
      ? "กดคำนวณ"
      : this.preparation.calculatedDose === null
        ? "HOLD • hypoglycemia protocol • แจ้งแพทย์"
        : `${this.preparation.glucose > 350 ? "แจ้งแพทย์ • " : ""}ขนาดยา ${this.preparation.calculatedDose} units`;
    this.add
      .text(displayX, displayY + calcHeight * 0.24, resultText, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(13, height * 0.018)}px`,
        fontStyle: "bold",
        color: this.preparation.doseCalculated ? "#c5f2c9" : "#d9ded9",
        stroke: "#101713",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(5);

    const controlX = calcX - calcWidth * 0.57;
    this.addRoundButton(
      "+",
      controlX,
      calcY - calcHeight * 0.16,
      Math.max(26, height * 0.033),
      0x55766f,
      () => this.changeGlucose(1),
    );
    this.addRoundButton(
      "−",
      controlX,
      calcY + calcHeight * 0.16,
      Math.max(26, height * 0.033),
      0x55766f,
      () => this.changeGlucose(-1),
    );

    const canCalc = this.canCalculate();
    this.add
      .text(
        width / 2,
        height * 0.75,
        canCalc ? "ยาและไซริงพร้อม ✓" : "ต้องเลือกยาและไซริงก่อนจึงจะคำนวณ",
        {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(13, height * 0.015)}px`,
          color: canCalc ? "#c9e3cf" : "#f4d7a2",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
    this.addButton(
      "คำนวณ",
      width * 0.42,
      height * 0.87,
      Math.min(width * 0.2, 250),
      Math.max(42, height * 0.055),
      () => this.calculateDose(),
      !canCalc,
    );
    const canAspirate = this.canAspirate();
    this.addButton(
      "ไปดูดยา  ›",
      width * 0.68,
      height * 0.87,
      Math.min(width * 0.22, 280),
      Math.max(42, height * 0.055),
      () => this.navigate("syringe"),
      !canAspirate,
    );
  }

  private drawAspiration(width: number, height: number) {
    this.drawPageTitle(
      width,
      height,
      "ดูดยา",
      "ทำขั้นตอนก่อนหน้าให้ครบก่อนเริ่มดูดยา",
    );
    const frameIndex = Phaser.Math.Clamp(
      this.preparation.aspirationStep,
      0,
      syringeFrames.length - 1,
    );
    const frameKey = syringeFrames[frameIndex];
    const source = this.textures
      .get(frameKey)
      .getSourceImage() as HTMLImageElement;
    const fitScale = Math.min(
      (width * 0.59) / source.width,
      (height * 0.57) / source.height,
    );
    const centerX = width / 2;
    const centerY = height * 0.52;
    this.add.image(centerX, centerY, frameKey).setScale(fitScale).setDepth(3);
    this.add
      .text(centerX, height * 0.23, `ขั้นตอนดูดยา  ${frameIndex + 1}/4`, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(17, height * 0.021)}px`,
        fontStyle: "bold",
        color: "#f2ead9",
      })
      .setOrigin(0.5)
      .setDepth(5);

    const canAspirate = this.canAspirate();
    if (!canAspirate) {
      this.add
        .text(centerX, height * 0.77, this.aspirationBlockMessage(), {
          fontFamily: this.uiFontFamily,
          fontSize: `${Math.max(13, height * 0.016)}px`,
          color: "#f2d49a",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(5);
    }
    const lastFrame = frameIndex === syringeFrames.length - 1;
    this.addButton(
      lastFrame ? "เสร็จสิ้น" : "ดูดยา  ›",
      width * 0.895,
      height * 0.54,
      Math.min(width * 0.16, 240),
      Math.max(50, height * 0.065),
      () => {
        if (!this.canAspirate()) {
          this.showNotice("ต้องเลือกยา เลือกไซริง และคำนวณโดสให้เรียบร้อยก่อน");
          return;
        }
        if (lastFrame) {
          this.updatePreparation({ aspirated: true });
          this.sound.play("cabinetDoorSound", { volume: 0.45 });
          this.close();
          return;
        }
        this.updatePreparation({ aspirationStep: frameIndex + 1 });
        this.sound.play("cabinetClickSound", { volume: 0.75 });
        this.draw();
      },
      !canAspirate,
    );
  }

  private drawPageTitle(
    width: number,
    height: number,
    title: string,
    subtitle: string,
  ) {
    this.add
      .text(width / 2, height * 0.18, title, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(24, height * 0.034)}px`,
        fontStyle: "bold",
        color: "#f2ead9",
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.add
      .text(width / 2, height * 0.225, subtitle, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(12, height * 0.015)}px`,
        color: "#c1cbc5",
      })
      .setOrigin(0.5)
      .setDepth(3);
  }

  private drawInfoPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    color = 0xe9e1d2,
  ) {
    this.add.rectangle(x + 2, y + 5, width, height, 0x000000, 0.28).setDepth(3);
    this.add
      .rectangle(x, y, width, height, color, 0.98)
      .setStrokeStyle(2, 0x5c5144)
      .setDepth(4);
  }

  private addButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    onClick: () => void,
    disabled = false,
  ) {
    const face = this.add
      .rectangle(x, y, width, height, disabled ? 0x566064 : 0x486b63, 0.98)
      .setStrokeStyle(2, disabled ? 0x78817f : 0xe3d1ad)
      .setDepth(7)
      .setInteractive({ useHandCursor: !disabled });
    const text = this.add
      .text(x, y, label, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(14, Math.min(20, height * 0.35))}px`,
        fontStyle: "bold",
        color: disabled ? "#b7bfbc" : "#fff5e3",
      })
      .setOrigin(0.5)
      .setDepth(8);
    if (disabled) {
      face.setAlpha(0.72);
      text.setAlpha(0.78);
    }
    face.on("pointerover", () => {
      if (!disabled) face.setFillStyle(0x5e887d, 1);
    });
    face.on("pointerout", () => {
      if (!disabled) face.setFillStyle(0x486b63, 0.98);
    });
    face.on("pointerdown", () => {
      if (disabled) {
        this.showNotice(
          this.page === "syringe"
            ? this.aspirationBlockMessage()
            : "ทำขั้นตอนก่อนหน้าให้ครบก่อน",
        );
        return;
      }
      this.sound.play("cabinetClickSound", { volume: 0.65 });
      onClick();
    });
  }

  private addRoundButton(
    label: string,
    x: number,
    y: number,
    radius: number,
    color: number,
    onClick: () => void,
  ) {
    const button = this.add
      .circle(x, y, radius, color)
      .setStrokeStyle(2, 0xe6d8bd)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y - 1, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${radius * 1.3}px`,
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(7);
    button.on("pointerover", () => button.setFillStyle(0x70988d));
    button.on("pointerout", () => button.setFillStyle(color));
    button.on("pointerdown", () => {
      this.sound.play("cabinetClickSound", { volume: 0.65 });
      onClick();
    });
  }

  private selectMedicine() {
    this.updatePreparation({
      medicineSelected: true,
      doseCalculated: false,
      calculatedDose: null,
      aspirated: false,
      aspirationStep: 0,
    });
    this.sound.play("cabinetGlassSound", { volume: 0.55 });
    this.draw();
  }

  private selectSyringe(index: number) {
    this.updatePreparation({
      syringeSelected: index,
      doseCalculated: false,
      calculatedDose: null,
      aspirated: false,
      aspirationStep: 0,
    });
    this.sound.play("cabinetGlassSound", { volume: 0.55 });
    this.draw();
  }

  private changeGlucose(delta: number) {
    this.updatePreparation({
      glucose: Math.max(0, Math.min(600, this.preparation.glucose + delta)),
      doseCalculated: false,
      calculatedDose: null,
      aspirated: false,
      aspirationStep: 0,
    });
    this.draw();
  }

  private calculateDose() {
    if (!this.canCalculate()) {
      this.showNotice("เลือก Regular Insulin U-100 และไซริงก่อนคำนวณ");
      return;
    }
    const glucose = this.preparation.glucose;
    let dose: number | null;
    if (glucose < 70) dose = null;
    else if (glucose <= 150) dose = 0;
    else if (glucose <= 200) dose = 2;
    else if (glucose <= 250) dose = 4;
    else if (glucose <= 300) dose = 6;
    else if (glucose <= 350) dose = 8;
    else dose = 10;
    this.updatePreparation({
      calculatedDose: dose,
      doseCalculated: true,
      aspirated: false,
      aspirationStep: 0,
    });
    this.sound.play("cabinetClickSound", { volume: 0.8 });
    this.draw();
  }

  private canCalculate() {
    return (
      this.preparation.medicineSelected &&
      this.preparation.syringeSelected !== null
    );
  }

  private canAspirate() {
    return (
      this.canCalculate() &&
      this.preparation.doseCalculated &&
      this.preparation.calculatedDose !== null &&
      this.preparation.calculatedDose > 0
    );
  }

  private aspirationBlockMessage() {
    if (!this.canCalculate()) return "เลือกยาและไซริงก่อน จึงจะไปขั้นดูดยาได้";
    if (!this.preparation.doseCalculated)
      return "คำนวณโดสก่อน จึงจะไปขั้นดูดยาได้";
    if (this.preparation.calculatedDose === null)
      return "HOLD: ทำ hypoglycemia protocol และแจ้งแพทย์ งดดูดยา";
    if (this.preparation.calculatedDose === 0)
      return "คำสั่งเป็น 0 units จึงไม่ต้องดูดยา";
    return "ทำขั้นตอนก่อนหน้าให้ครบก่อน";
  }

  private updatePreparation(update: Partial<MedicationPreparation>) {
    this.preparation = { ...this.preparation, ...update };
    this.registry.set("medicationPreparation", this.preparation);
  }

  private navigate(page: CabinetPage) {
    this.page = page;
    this.draw();
  }

  private showNotice(message: string) {
    this.notice?.destroy();
    this.notice = this.add
      .text(this.scale.width / 2, this.scale.height * 0.94, message, {
        fontFamily: this.uiFontFamily,
        fontSize: `${Math.max(12, Math.min(18, this.scale.height * 0.016))}px`,
        fontStyle: "bold",
        color: "#fff3d9",
        backgroundColor: "#422f27",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(30);
  }

  private close() {
    this.scene.stop();
    this.scene.resume("MedicationTray");
  }
}
