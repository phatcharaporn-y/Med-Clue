import Phaser from "phaser";

type Preparation = {
  medicineSelected: boolean;
  medicineBottle?: number | null;
  syringeSelected: number | null;
  glucose: number;
  calculatedDose: number | null;
  doseCalculated: boolean;
  aspirated: boolean;
  aspirationStep: number;
};

const initial: Preparation = {
  medicineSelected: false,
  medicineBottle: null,
  syringeSelected: null,
  glucose: 214,
  calculatedDose: null,
  doseCalculated: false,
  aspirated: false,
  aspirationStep: 0,
};

abstract class MedicationStepScene extends Phaser.Scene {
  protected font = "Arial, sans-serif";
  protected sceneTitleColor = "#ffffff";
  protected state: Preparation = { ...initial };

  protected begin(title: string, onResize: () => void, showTitle = true) {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.font = `${promptFont}, Arial, sans-serif`;
    this.state = this.registry.get("medicationPreparation") ?? { ...initial };
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off(Phaser.Scale.Events.RESIZE, onResize, this),
    );
    this.drawShell(title, showTitle);
  }

  protected drawShell(title: string, showTitle = true) {
    const { width, height } = this.scale;
    this.children.removeAll(true);
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setDepth(0)
      .setInteractive();
    if (showTitle)
      this.add
        .text(width / 2, height * 0.1, title, {
          fontFamily: this.font,
          fontSize: `${Math.max(25, height * 0.038)}px`,
          fontStyle: "bold",
          color: this.sceneTitleColor,
        })
        .setOrigin(0.5)
        .setDepth(2);
    this.add
      .text(
        Math.max(24, width * 0.025),
        Math.max(30, height * 0.045),
        "< ถาดอุปกรณ์",
        {
          fontFamily: this.font,
          fontSize: `${Math.max(18, Math.min(26, height * 0.026))}px`,
          fontStyle: "bold",
          color: "#fff",
          stroke: "#05090b",
          strokeThickness: 4,
        },
      )
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.backToTray());
  }

  protected backToTray() {
    this.scene.stop();
    this.scene.resume("MedicationTray");
  }

  protected save(update: Partial<Preparation>) {
    this.state = { ...this.state, ...update };
    this.registry.set("medicationPreparation", this.state);
  }

  protected text(
    x: number,
    y: number,
    value: string,
    size: number,
    color = "#f2ead9",
  ) {
    return this.add
      .text(x, y, value, {
        fontFamily: this.font,
        fontSize: `${size}px`,
        color,
        align: "center",
        wordWrap: { width: this.scale.width * 0.8 },
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  protected button(
    label: string,
    x: number,
    y: number,
    width: number,
    onClick: () => void,
    disabled = false,
  ) {
    const height = Math.max(48, this.scale.height * 0.06);
    const face = this.add
      .rectangle(x, y, width, height, disabled ? 0x566064 : 0x486b63, 0.98)
      .setStrokeStyle(2, 0xe3d1ad)
      .setDepth(7)
      .setInteractive({ useHandCursor: !disabled });
    this.add
      .text(x, y, label, {
        fontFamily: this.font,
        fontSize: `${Math.max(14, Math.min(20, height * 0.35))}px`,
        fontStyle: "bold",
        color: disabled ? "#b7bfbc" : "#fff5e3",
      })
      .setOrigin(0.5)
      .setDepth(8);
    face.on("pointerover", () => {
      if (!disabled) face.setFillStyle(0x5e887d, 1);
    });
    face.on("pointerout", () => {
      if (!disabled) face.setFillStyle(0x486b63, 0.98);
    });
    face.on("pointerdown", () => {
      if (!disabled) {
        this.sound.play("medStepClick", { volume: 2.0 });
        onClick();
      }
    });
  }

  protected canCalculate() {
    return this.state.medicineSelected && this.state.syringeSelected !== null;
  }
  protected canAspirate() {
    return (
      this.canCalculate() &&
      this.state.doseCalculated &&
      this.state.calculatedDose !== null &&
      this.state.calculatedDose > 0
    );
  }
  protected invalidated() {
    return {
      doseCalculated: false,
      calculatedDose: null,
      aspirated: false,
      aspirationStep: 0,
    };
  }
}

export class MedicationCabinetScene extends MedicationStepScene {
  private enlargedBottleOpen = false;
  private enlargedBottleIndex = 0;

  constructor() {
    super("MedicationCabinet");
  }
  preload() {
    this.load.image("medicineFridge", "/images/game/refige.png");
    this.load.image("regularInsulinVial", "/images/game/Regular_Insulin.png");
    this.load.audio("medStepClick", "/sounds/interface-click.wav");
    this.load.audio("medStepGlass", "/sounds/glass-hitting.wav");
  }
  create() {
    this.begin("", this.draw, false);
    this.draw();
  }
  private draw = () => {
    this.drawShell("", false);
    const { width, height } = this.scale;
    const fridge = this.textures
      .get("medicineFridge")
      .getSourceImage() as HTMLImageElement;
    // Cover the full scene while preserving the cabinet artwork's aspect ratio.
    const scale = Math.max(width / fridge.width, height / fridge.height) * 0.5;
    // Adjust these two values to move the cabinet image independently.
    const fridgeX = width * 0.5;
    const fridgeY = height * 0.75;
    const image = this.add
      .image(fridgeX, fridgeY, "medicineFridge")
      .setScale(scale)
      .setDepth(2);
    const vialTexture = this.textures
      .get("regularInsulinVial")
      .getSourceImage() as HTMLImageElement;
    const vialScale = Math.min(
      (image.displayHeight * 0.19) / vialTexture.height,
      (image.displayWidth * 0.12) / vialTexture.width,
    );
    const rowY = image.y - image.displayHeight * 0.075;
    [-0.2, 0, 0.2].forEach((offset, index) => {
      const x = image.x + image.displayWidth * offset;
      const vial = this.add
        .image(x, rowY, "regularInsulinVial")
        .setScale(vialScale)
        .setDepth(4)
        .setInteractive({ useHandCursor: true });
      const baseScale = vialScale;
      vial.on("pointerover", () => vial.setScale(baseScale * 1.08));
      vial.on("pointerout", () => vial.setScale(baseScale));
      vial.on("pointerdown", () => {
        const deselect = this.state.medicineBottle === index;
        this.save({
          medicineSelected: !deselect,
          medicineBottle: deselect ? null : index,
          ...this.invalidated(),
        });
        this.sound.play("medStepGlass", { volume: 0.55 });
        this.draw();
      });
      if (this.state.medicineBottle === index) {
        const tagY = rowY + vial.displayHeight * 0.22;
        const tagWidth = Math.max(110, vial.displayWidth * 1.12);
        const tagHeight = Math.max(30, height * 0.038);
        this.add
          .rectangle(x, tagY, tagWidth, tagHeight, 0xfdbd48, 1)
          .setStrokeStyle(2, 0x111111)
          .setDepth(8);
        this.add
          .text(x, tagY, "เลือกขวดนี้", {
            fontFamily: this.font,
            fontSize: `${Math.max(14, height * 0.017)}px`,
            fontStyle: "bold",
            color: "#111111",
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(9);
      }
      const previewX = x - vial.displayWidth * 0.36;
      const previewY = rowY - vial.displayHeight * 0.56;
      const lensRadius = Math.max(8, height * 0.012);
      const preview = this.add
        .circle(previewX, previewY, lensRadius * 1.8, 0x111820, 0.88)
        .setStrokeStyle(1.5, 0xffffff)
        .setDepth(8)
        .setInteractive({ useHandCursor: true });
      const magnifier = this.add.graphics().setDepth(9);
      magnifier.lineStyle(Math.max(2, height * 0.002), 0xffffff, 1);
      magnifier.strokeCircle(
        previewX - lensRadius * 0.16,
        previewY - lensRadius * 0.16,
        lensRadius * 0.55,
      );
      magnifier.lineBetween(
        previewX + lensRadius * 0.2,
        previewY + lensRadius * 0.2,
        previewX + lensRadius * 0.65,
        previewY + lensRadius * 0.65,
      );
      preview.on("pointerdown", () => {
        this.enlargedBottleIndex = index;
        this.enlargedBottleOpen = true;
        this.draw();
      });
    });
    this.drawConfirmButton(width, height);
    if (this.enlargedBottleOpen) this.drawBottlePreview(width, height);
  };

  private drawConfirmButton(width: number, height: number) {
    const x = width * 0.83;
    const y = height * 0.9;
    const buttonW = Math.min(width * 0.24, 360);
    const buttonH = Math.max(48, Math.min(68, height * 0.065));
    const selected = this.state.medicineSelected;
    this.add.rectangle(x, y + 3, buttonW, buttonH, 0x3f2523).setDepth(9);
    const button = this.add
      .rectangle(x, y, buttonW, buttonH, selected ? 0x754444 : 0x514344)
      .setStrokeStyle(1.5, 0x3f2523)
      .setDepth(10)
      .setInteractive({ useHandCursor: selected });
    const icon = this.add
      .text(x - buttonW * 0.29, y, "✓", {
        fontFamily: "Arial, sans-serif",
        fontSize: `${Math.max(19, buttonH * 0.38)}px`,
        fontStyle: "bold",
        color: selected ? "#ffffff" : "#bcb5b5",
      })
      .setOrigin(0.5)
      .setDepth(11);
    const label = this.add
      .text(x + buttonW * 0.06, y, "ยืนยันเลือก", {
        fontFamily: this.font,
        fontSize: `${Math.max(17, buttonH * 0.32)}px`,
        fontStyle: "bold",
        color: selected ? "#ffffff" : "#bcb5b5",
      })
      .setOrigin(0.5)
      .setDepth(11);
    if (!selected) return;
    button.on("pointerover", () => {
      button.setFillStyle(0x875252);
      this.tweens.add({
        targets: [button, icon, label],
        y: y - 2,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    button.on("pointerout", () => {
      button.setFillStyle(0x754444);
      this.tweens.add({
        targets: [button, icon, label],
        y,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    const confirm = () => {
      this.sound.play("medStepClick", { volume: 2.0 });
      this.backToTray();
    };
    button.on("pointerdown", confirm);
    icon.setInteractive({ useHandCursor: true }).on("pointerdown", confirm);
    label.setInteractive({ useHandCursor: true }).on("pointerdown", confirm);
  }

  private drawBottlePreview(width: number, height: number) {
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.86)
      .setDepth(30)
      .setInteractive();
    const source = this.textures
      .get("regularInsulinVial")
      .getSourceImage() as HTMLImageElement;
    const bottle = this.add
      .image(width / 2, height / 2, "regularInsulinVial")
      .setScale(
        Math.min(
          (width * 0.62) / source.width,
          (height * 0.82) / source.height,
        ),
      )
      .setDepth(31);
    this.add
      .text(Math.max(24, width * 0.025), Math.max(30, height * 0.045), "< กลับ", {
        fontFamily: "Arial, sans-serif",
        fontSize: `${Math.max(18, Math.min(26, height * 0.026))}px`,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#111111",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5)
      .setDepth(32)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
      this.enlargedBottleOpen = false;
      this.draw();
    });
    // Keep the selected bottle context available while the enlarged view is open.
    void bottle;
    void this.enlargedBottleIndex;
  }
}

export class MedicationSyringesScene extends MedicationStepScene {
  constructor() {
    super("MedicationSyringes");
  }
  preload() {
    this.load.image("cabinetSyringe", "/images/game/kem.png");
    this.load.audio("medStepClick", "/sounds/interface-click.wav");
    this.load.audio("medStepGlass", "/sounds/glass-hitting.wav");
  }
  create() {
    this.begin("เลือกไซริง / เข็ม", this.draw);
    this.draw();
    
  }
  private draw = () => {
    
    this.drawShell("เลือกไซริง / เข็ม");
    
    const { width, height } = this.scale;
    const image = this.textures
      .get("cabinetSyringe")
      .getSourceImage() as HTMLImageElement;
    const labels = [
      "U-100 0.3 mL (30 units)",
      "U-200 0.4 mL (20 units)",
      "U-100 0.2 mL (30 units)",
    ];
    const syringeScale = Math.min(
      (width * 0.27) / image.width,
      (height * 0.5) / image.height,
    );
    const syringeWidth = image.width * syringeScale;
    const rotation = Phaser.Math.DegToRad(-45);
    labels.forEach((label, index) => {
      const x = width * (0.29 + index * 0.27),
        y = height * 0.53;
      const syringe = this.add
        .image(x, y, "cabinetSyringe")
        .setScale(syringeScale)
        .setRotation(rotation)
        .setDepth(3);
      const selected = this.state.syringeSelected === index;
      const nameX = x - width * 0.08;
      const nameY = y - height * 0.08;
      const nameWidth = Math.min(width * 0.135, 250);
      const nameHeight = Math.max(38, height * 0.05);
      this.add
        .rectangle(nameX, nameY, nameWidth, nameHeight, 0xffffff, 1)
        .setStrokeStyle(2, 0x111111)
        .setDepth(5);
      this.add
        .text(nameX, nameY, label, {
          fontFamily: this.font,
          fontSize: `${Math.max(14, height * 0.017)}px`,
          fontStyle: "bold",
          color: "#111111",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(6);
      if (selected) {
        const tagY = y + syringe.displayHeight * 0.6;
        const tagWidth = Math.min(
          width * 0.22,
          Math.max(150, syringeWidth * 0.48),
        );
        const tagHeight = Math.max(34, height * 0.042);
        const selectedTag = this.add
          .rectangle(x, tagY, tagWidth, tagHeight, 0xfdbd48, 1)
          .setStrokeStyle(2, 0x111111)
          .setDepth(5);
        const selectedLabel = this.add
          .text(x, tagY, "เลือกไซริงนี้", {
            fontFamily: this.font,
            fontSize: `${Math.max(14, height * 0.017)}px`,
            fontStyle: "bold",
            color: "#111111",
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(6);
        selectedTag.setScale(0.82);
        selectedLabel.setScale(0.82);
        this.tweens.add({
          targets: [selectedTag, selectedLabel],
          scale: 1,
          duration: 220,
          ease: "Back.Out",
        });
      }
      const hitArea = this.add
        .rectangle(x, y, syringeWidth * 0.78, syringeWidth * 0.78, 0xffffff, 0)
        .setDepth(7)
        .setInteractive({ useHandCursor: true });
      hitArea.on("pointerover", () => {
        this.tweens.killTweensOf(syringe);
        this.tweens.add({
          targets: syringe,
          scaleX: syringeScale * 1.08,
          scaleY: syringeScale * 1.08,
          duration: 160,
          ease: "Sine.Out",
        });
      });
      hitArea.on("pointerout", () => {
        this.tweens.killTweensOf(syringe);
        this.tweens.add({
          targets: syringe,
          scaleX: syringeScale,
          scaleY: syringeScale,
          duration: 160,
          ease: "Sine.Out",
        });
      });
      hitArea.on("pointerdown", () => {
        const deselect = this.state.syringeSelected === index;
        this.save({
          syringeSelected: deselect ? null : index,
          ...this.invalidated(),
        });
        this.sound.play("medStepGlass", { volume: 0.55 });
        this.draw();
      });
    });
    this.drawSyringeConfirmButton(width, height);
  };

  private drawSyringeConfirmButton(width: number, height: number) {
    const x = width * 0.83;
    const y = height * 0.9;
    const buttonW = Math.min(width * 0.24, 360);
    const buttonH = Math.max(48, Math.min(68, height * 0.065));
    const selected = this.state.syringeSelected !== null;
    this.add.rectangle(x, y + 3, buttonW, buttonH, 0x3f2523).setDepth(9);
    const button = this.add
      .rectangle(x, y, buttonW, buttonH, selected ? 0x754444 : 0x514344)
      .setStrokeStyle(1.5, 0x3f2523)
      .setDepth(10)
      .setInteractive({ useHandCursor: selected });
    const icon = this.add
      .text(x - buttonW * 0.29, y, "✓", {
        fontFamily: "Arial, sans-serif",
        fontSize: `${Math.max(19, buttonH * 0.38)}px`,
        fontStyle: "bold",
        color: selected ? "#ffffff" : "#bcb5b5",
      })
      .setOrigin(0.5)
      .setDepth(11);
    const label = this.add
      .text(x + buttonW * 0.06, y, "ยืนยันเลือก", {
        fontFamily: this.font,
        fontSize: `${Math.max(17, buttonH * 0.32)}px`,
        fontStyle: "bold",
        color: selected ? "#ffffff" : "#bcb5b5",
      })
      .setOrigin(0.5)
      .setDepth(11);
    if (!selected) return;
    button.on("pointerover", () => {
      button.setFillStyle(0x875252);
      this.tweens.add({
        targets: [button, icon, label],
        y: y - 2,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    button.on("pointerout", () => {
      button.setFillStyle(0x754444);
      this.tweens.add({
        targets: [button, icon, label],
        y,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    const confirm = () => {
      this.sound.play("medStepClick", { volume: 2.0 });
      this.backToTray();
    };
    button.on("pointerdown", confirm);
    icon.setInteractive({ useHandCursor: true }).on("pointerdown", confirm);
    label.setInteractive({ useHandCursor: true }).on("pointerdown", confirm);
  }
}

export class MedicationDoseScene extends MedicationStepScene {
  protected sceneTitleColor = "#ffffff";
  private glucoseDisplay?: Phaser.GameObjects.Text;
  private doseResultDisplay?: Phaser.GameObjects.Text;
  private arrowHoldTimer?: Phaser.Time.TimerEvent;
  private arrowHoldStartedAt = 0;
  private isArrowHeld = false;
  constructor() {
    super("MedicationDose");
  }
  preload() {
    this.load.image("doseCalculator", "/images/game/dosecal.png");
    this.load.audio("medStepClick", "/sounds/interface-click.wav");
  }
  create() {
    this.begin("คำนวณขนาดยา", this.draw);
    this.input.on("pointerup", this.stopArrowHold, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopArrowHold();
      this.input.off("pointerup", this.stopArrowHold, this);
    });
    this.draw();
  }
  private draw = () => {
    this.stopArrowHold();
    this.drawShell("คำนวณขนาดยา");
    const { width, height } = this.scale;
    const calculator = this.textures
      .get("doseCalculator")
      .getSourceImage() as HTMLImageElement;
    const calcX = width * 0.5;
    const calcY = height * 0.51;
    const calculatorImage = this.add
      .image(calcX, calcY, "doseCalculator")
      .setScale(
        Math.min(
          (width * 0.51) / calculator.width,
          (height * 0.59) / calculator.height,
        ),
      )
      .setDepth(2);

    const dosePositions = {
      cbgLabel: {
        x: calcX - calculatorImage.displayWidth * 0.16,
        y: calcY - calculatorImage.displayHeight * 0.28,
      },
      glucose: {
        x: calcX - calculatorImage.displayWidth * 0.16,
        y: calcY - calculatorImage.displayHeight * 0.04,
      },
      incrementHint: {
        x: calcX - calculatorImage.displayWidth * 0.16,
        y: calcY + calculatorImage.displayHeight * 0.15,
      },
      result: {
        x: calcX - calculatorImage.displayWidth * 0.16,
        y: calcY + calculatorImage.displayHeight * 0.32,
      },
      upArrow: {
        x: calcX + calculatorImage.displayWidth * 0.35,
        y: calcY - calculatorImage.displayHeight * 0.08,
      },
      downArrow: {
        x: calcX + calculatorImage.displayWidth * 0.35,
        y: calcY + calculatorImage.displayHeight * 0.12,
      },
      prerequisiteWarning: { x: width / 2, y: height * 0.78 },
      calculateButton: { x: width / 2, y: height * 0.84 },
    };
    this.text(
      dosePositions.cbgLabel.x,
      dosePositions.cbgLabel.y,
      "ค่า CBG (mg/dL)",
      Math.max(18, height * 0.022),
    );
    this.glucoseDisplay = this.text(
      dosePositions.glucose.x,
      dosePositions.glucose.y,
      `${this.state.glucose}`,
      Math.max(42, height * 0.07),
      "#f0f2cf",
    );
    this.text(
      dosePositions.incrementHint.x,
      dosePositions.incrementHint.y,
      "ปรับครั้งละ 1 mg/dL",
      Math.max(13, height * 0.016),
      "#c1cbc5",
    );
    this.drawDoseArrow(
      "▲",
      dosePositions.upArrow.x,
      dosePositions.upArrow.y,
      1,
    );
    this.drawDoseArrow(
      "▼",
      dosePositions.downArrow.x,
      dosePositions.downArrow.y,
      -1,
    );
    const result = this.state.doseCalculated
      ? this.state.calculatedDose === null
        ? "HOLD • ทำ hypoglycemia protocol และแจ้งแพทย์"
        : `${this.state.glucose > 350 ? "แจ้งแพทย์ • " : ""}ขนาดยา ${this.state.calculatedDose} units`
      : "";
    this.doseResultDisplay = this.text(
      dosePositions.result.x,
      dosePositions.result.y,
      result,
      Math.max(17, height * 0.021),
      "#c9e3cf",
    );
    this.text(
      dosePositions.prerequisiteWarning.x,
      dosePositions.prerequisiteWarning.y,
      this.canCalculate()
        ? "ยาและไซริงพร้อม ✓"
        : "ต้องเลือกยาที่ตู้ยาและเลือกไซริงจากถาดก่อน",
      Math.max(14, height * 0.017),
      "#f4d7a2",
    );
    this.drawDoseConfirmButton(
      dosePositions.calculateButton.x,
      dosePositions.calculateButton.y,
      Math.min(300, width * 0.22),
      () => {
        if (this.state.doseCalculated) {
          this.backToTray();
          return;
        }
        if (!this.canCalculate()) return;
        const g = this.state.glucose;
        const dose =
          g < 70
            ? null
            : g <= 150
              ? 0
              : g <= 200
                ? 2
                : g <= 250
                  ? 4
                  : g <= 300
                    ? 6
                    : g <= 350
                      ? 8
                      : 10;
        this.save({
          calculatedDose: dose,
          doseCalculated: true,
          aspirated: false,
          aspirationStep: 0,
        });
        this.draw();
      },
      !this.canCalculate(),
    );
  };

  private drawDoseConfirmButton(
    x: number,
    y: number,
    buttonW: number,
    onConfirm: () => void,
    disabled: boolean,
  ) {
    const buttonH = Math.max(48, Math.min(68, this.scale.height * 0.065));
    const faceColor = disabled ? 0x514344 : 0x754444;
    this.add.rectangle(x, y + 3, buttonW, buttonH, 0x3f2523).setDepth(9);
    const face = this.add
      .rectangle(x, y, buttonW, buttonH, faceColor)
      .setStrokeStyle(1.5, 0x3f2523)
      .setDepth(10)
      .setInteractive({ useHandCursor: !disabled });
    const icon = this.add
      .text(x - buttonW * 0.24, y, "✓", {
        fontFamily: "Arial, sans-serif",
        fontSize: `${Math.max(19, buttonH * 0.38)}px`,
        fontStyle: "bold",
        color: disabled ? "#bcb5b5" : "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(11);
    const label = this.add
      .text(x + buttonW * 0.07, y, this.state.doseCalculated ? "ยืนยัน" : "คำนวณ", {
        fontFamily: this.font,
        fontSize: `${Math.max(17, buttonH * 0.32)}px`,
        fontStyle: "bold",
        color: disabled ? "#bcb5b5" : "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(11);
    if (disabled) return;
    face.on("pointerover", () => {
      face.setFillStyle(0x875252);
      this.tweens.add({
        targets: [face, icon, label],
        y: y - 2,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    face.on("pointerout", () => {
      face.setFillStyle(0x754444);
      this.tweens.add({
        targets: [face, icon, label],
        y,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    const confirm = () => {
      this.sound.play("medStepClick", { volume: 2.0 });
      onConfirm();
    };
    face.on("pointerdown", confirm);
    icon.setInteractive({ useHandCursor: true }).on("pointerdown", confirm);
    label.setInteractive({ useHandCursor: true }).on("pointerdown", confirm);
  }

  private drawDoseArrow(label: string, x: number, y: number, delta: 1 | -1) {
    const { height } = this.scale;
    const radius = Math.max(25, Math.min(36, height * 0.034));
    const circle = this.add
      .circle(x, y, radius, 0x754444, 0.98)
      .setStrokeStyle(2.5, 0x1E1E1E)
      .setDepth(7)
      .setInteractive({ useHandCursor: true });
    const arrow = this.add
      .text(x, y - 1, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${radius * 0.78}px`,
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(8);
    circle.on("pointerover", () => {
      this.tweens.add({
        targets: [circle, arrow],
        scale: 1.12,
        duration: 130,
        ease: "Sine.Out",
      });
      circle.setFillStyle(0x925858, 1);
    });
    circle.on("pointerout", () => {
      this.stopArrowHold();
      this.tweens.add({
        targets: [circle, arrow],
        scale: 1,
        duration: 130,
        ease: "Sine.Out",
      });
      circle.setFillStyle(0x754444, 0.98);
    });
    circle.on("pointerdown", () => {
      this.sound.play("medStepClick", { volume: 2.0 });
      this.stopArrowHold();
      this.isArrowHeld = true;
      this.arrowHoldStartedAt = this.time.now;
      this.adjustGlucose(delta);
      this.scheduleArrowRepeat(delta, 400);
    });
  }

  private adjustGlucose(delta: 1 | -1) {
    this.save({
      glucose: Math.max(0, Math.min(600, this.state.glucose + delta)),
      ...this.invalidated(),
    });
    this.glucoseDisplay?.setText(`${this.state.glucose}`);
    this.doseResultDisplay?.setText("");
  }

  private scheduleArrowRepeat(delta: 1 | -1, delay: number) {
    this.arrowHoldTimer = this.time.delayedCall(delay, () => {
      if (!this.isArrowHeld) return;
      this.adjustGlucose(delta);
      const heldFor = this.time.now - this.arrowHoldStartedAt;
      const nextDelay = heldFor > 1400 ? 38 : heldFor > 700 ? 65 : 110;
      this.scheduleArrowRepeat(delta, nextDelay);
    });
  }

  private stopArrowHold() {
    this.isArrowHeld = false;
    this.arrowHoldTimer?.remove(false);
    this.arrowHoldTimer = undefined;
  }
}

export class MedicationAspirationScene extends MedicationStepScene {
  private isAspirating = false;
  private remainingSeconds = 5;
  private aspirationTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("MedicationAspiration");
  }
  preload() {
    ["f1.png", "f2.png", "f3.png", "f4.png"].forEach((file, i) =>
      this.load.image(`aspiration${i + 1}`, `/images/game/${file}`),
    );
    this.load.audio("medStepClick", "/sounds/interface-click.wav");
    this.load.audio("swallowingDrink", "/sounds/swallowing-drink.wav");
  }
  create() {
    this.begin("ดูดยา", this.draw);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.aspirationTimer?.remove(false);
      this.aspirationTimer = undefined;
      this.isAspirating = false;
    });
    this.draw();
  }
  private draw = () => {
    this.drawShell("ดูดยา");
    const { width, height } = this.scale;
    const allowed = this.canAspirate();
    const frame = Phaser.Math.Clamp(this.state.aspirationStep, 0, 3);
    const key = `aspiration${frame + 1}`;
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    if (this.isAspirating && this.remainingSeconds === 1) {
      this.text(width * 0.4, height * 0.52, "ตรวจสอบขั้นตอนสุดท้าย...", Math.max(20, height * 0.026));
    } else {
      this.add
        .image(width * 0.4, height * 0.52, key)
        .setScale(
          Math.min(
            (width * 0.48) / source.width,
            (height * 0.55) / source.height,
          ),
        )
        .setDepth(3);
    }
    this.text(
      width * 0.82,
      height * 0.37,
      `ขั้นตอน ${frame + 1}/4`,
      Math.max(18, height * 0.023),
    );
    this.text(
      width * 0.82,
      height * 0.48,
      allowed
        ? this.state.aspirated
          ? "ดูดยาเสร็จแล้ว ✓"
          : this.isAspirating
          ? this.remainingSeconds > 1
            ? `เหลืออีก ${this.remainingSeconds} วินาที`
            : "เหลืออีก 1 วินาที • ตรวจสอบขั้นตอน"
          : "ใช้เวลาประมาณ 5 วินาที"
        : this.blockMessage(),
      Math.max(14, height * 0.017),
      "#f4d7a2",
    );
    const progressX = width * 0.82;
    const progressY = height * 0.56;
    const progressWidth = Math.min(260, width * 0.19);
    const progressHeight = Math.max(10, height * 0.014);
    this.add.rectangle(progressX, progressY, progressWidth, progressHeight, 0x354047, 1)
      .setStrokeStyle(1, 0xd7c9aa).setDepth(5);
    if (this.isAspirating || this.state.aspirated) {
      const progress = this.state.aspirated ? 1 : (5 - this.remainingSeconds) / 5;
      this.add.rectangle(
        progressX - progressWidth * (1 - progress) / 2,
        progressY,
        Math.max(1, progressWidth * progress),
        progressHeight - 3,
        0xfdbd48,
        1,
      ).setDepth(6);
    }
    this.drawAspirationButton(
      progressX,
      height * 0.67,
      progressWidth,
      allowed,
    );
  };

  private drawAspirationButton(x: number, y: number, width: number, allowed: boolean) {
    const height = Math.max(54, Math.min(72, this.scale.height * 0.068));
    const disabled = !allowed || this.isAspirating;
    const completed = this.state.aspirated;
    const fill = disabled ? 0x514344 : 0x754444;
    this.add.rectangle(x, y + 4, width, height, 0x111820, 0.8).setDepth(7);
    const face = this.add.rectangle(x, y, width, height, fill, 1)
      .setStrokeStyle(2, disabled ? 0x78817f : 0x3f2523)
      .setDepth(8)
      .setInteractive({ useHandCursor: !disabled });
    const icon = this.add.text(x - width * 0.3, y,
      completed ? "✓" : this.isAspirating ? "●" : "▶", {
      fontFamily: "Arial, sans-serif",
      fontSize: `${Math.max(18, height * 0.32)}px`,
      fontStyle: "bold",
      color: disabled ? "#bcb5b5" : "#ffffff",
    }).setOrigin(0.5).setDepth(9);
    const label = this.add.text(x + width * 0.06, y,
      completed ? "ยืนยัน" : this.isAspirating ? "กำลังดูดยา..." : "เริ่มดูดยา", {
        fontFamily: this.font,
        fontSize: `${Math.max(16, height * 0.28)}px`,
        fontStyle: "bold",
        color: disabled ? "#bcb5b5" : "#ffffff",
      }).setOrigin(0.5).setDepth(9);
    if (this.isAspirating) {
      this.tweens.add({ targets: icon, alpha: 0.35, yoyo: true, repeat: -1, duration: 380 });
    }
    if (disabled) return;
    face.on("pointerover", () => {
      face.setFillStyle(0x875252, 1);
      this.tweens.add({ targets: [face, icon, label], y: y - 2, duration: 130, ease: "Sine.Out" });
    });
    face.on("pointerout", () => {
      face.setFillStyle(0x754444, 1);
      this.tweens.add({ targets: [face, icon, label], y, duration: 130, ease: "Sine.Out" });
    });
    const confirmOrStart = () => {
      if (this.state.aspirated) {
        this.sound.play("medStepClick", { volume: 2.0 });
        this.backToTray();
      } else {
        this.startAspiration();
      }
    };
    face.on("pointerdown", confirmOrStart);
    icon.setInteractive({ useHandCursor: !disabled }).on("pointerdown", confirmOrStart);
    label.setInteractive({ useHandCursor: !disabled }).on("pointerdown", confirmOrStart);
  }

  private startAspiration() {
    if (!this.canAspirate() || this.isAspirating) return;
    this.isAspirating = true;
    this.remainingSeconds = 5;
    this.save({ aspirationStep: 0 });
    this.sound.play("medStepClick", { volume: 2.0 });
    this.draw();
    this.aspirationTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.remainingSeconds -= 1;
        if (this.remainingSeconds <= 0) {
          this.aspirationTimer?.remove(false);
          this.aspirationTimer = undefined;
          this.isAspirating = false;
          this.save({ aspirated: true, aspirationStep: 3 });
          this.draw();
          return;
        }
        // Four syringe frames advance automatically at one second intervals.
        const elapsed = 5 - this.remainingSeconds;
        if (elapsed === 1 || elapsed === 2) {
          this.sound.play("swallowingDrink", { volume: 1.0 });
        }
        this.save({ aspirationStep: Math.min(3, elapsed) });
        this.draw();
      },
    });
  }

  private blockMessage() {
    if (!this.canCalculate()) return "เลือกยาและไซริงก่อน";
    if (!this.state.doseCalculated) return "คำนวณโดสก่อน";
    if (this.state.calculatedDose === null) return "HOLD: แจ้งแพทย์และงดดูดยา";
    return "ขนาดยาเป็น 0 units ไม่ต้องดูดยา";
  }
}
