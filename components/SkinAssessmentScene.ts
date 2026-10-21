import Phaser from "phaser";

const bodyAreas = [
  { id: "left-upper-arm", label: "ต้นแขนซ้าย", x: 0.8, y: 0.29, finding: "พบรอยแดงบริเวณต้นแขนซ้าย" },
  { id: "right-upper-arm", label: "ต้นแขนขวา", x: 0.2, y: 0.29, finding: "พบรอยช้ำเล็กน้อยบริเวณต้นแขนขวา" },
  { id: "left-abdomen", label: "หน้าท้องซ้าย", x: 0.35, y: 0.46, finding: "พบรอยช้ำบริเวณหน้าท้องซ้าย" },
  { id: "right-abdomen", label: "หน้าท้องขวา", x: 0.63, y: 0.46, finding: "พบรอยแดงบริเวณหน้าท้องขวา" },
  { id: "right-thigh", label: "ต้นขาขวา", x: 0.37, y: 0.62, finding: "ผิวหนังเรียบ ไม่พบรอยแดง รอยช้ำ หรือแผล" },
  { id: "left-thigh", label: "ต้นขาซ้าย", x: 0.63, y: 0.62, finding: "พบรอยเกาบริเวณต้นขาซ้าย" },
] as const;

export class SkinAssessmentScene extends Phaser.Scene {
  private checkedAreas = new Set<string>();
  private lastCheckedAreaId: string | null = null;
  private uiFont = "Arial, sans-serif";
  private response = "แตะจุดสีส้มเพื่อตรวจสอบสภาพผิว";

  constructor() {
    super("SkinAssessment");
  }

  preload() {
    this.load.image("skinAssessmentBody", "/images/game/body.png");
    this.load.image("skinAssessmentHint", "/images/game/hint.png");
    this.load.audio("skinAssessmentClick", "/sounds/iconclick.wav");
  }

  create() {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.uiFont = `${promptFont}, Arial, sans-serif`;
    this.checkedAreas = new Set();
    this.lastCheckedAreaId = null;
    this.scale.on(Phaser.Scale.Events.RESIZE, this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off(Phaser.Scale.Events.RESIZE, this.draw, this),
    );
    this.draw();
  }

  private draw = () => {
    this.children.removeAll(true);
    const { width, height } = this.scale;
    const scale = Math.min(width / 1280, height / 720);
    const textSize = (size: number) => `${Math.max(12, size * scale)}px`;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.52).setDepth(0);
    this.add
      .text(Math.max(24, width * 0.025), Math.max(30, height * 0.045), "< หัตถการ", {
        fontFamily: this.uiFont,
        fontSize: `${Math.max(18, Math.min(26, height * 0.026))}px`,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#151311",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.playClick();
        this.returnToProcedure();
      });

    const count = this.checkedAreas.size;
    const panelX = width * 0.28;
    const panelY = height * 0.53;
    const panelW = Math.min(width * 0.56, 720);
    const panelH = Math.min(height * 0.73, 590);
    const panelScale = Math.min(1, panelW / 720, panelH / 590);
    const panelTextSize = (size: number) => `${Math.max(12, size * panelScale)}px`;
    this.add.rectangle(panelX + 6, panelY + 8, panelW, panelH, 0x171411, 0.4).setDepth(2);
    this.add.rectangle(panelX, panelY, panelW, panelH, 0xf1e7d4)
      .setStrokeStyle(3, 0x29251f)
      .setDepth(3);
    this.add.rectangle(panelX, panelY, panelW - 12, panelH - 12, 0xfaf6ed)
      .setStrokeStyle(1, 0xc4b69b)
      .setDepth(4);
    this.add.rectangle(panelX, panelY - panelH * 0.5 + 7, panelW - 8, 10, 0x754444).setDepth(5);
    this.add.text(panelX - panelW * 0.42, panelY - panelH * 0.39, "SKIN ASSESSMENT", {
      fontFamily: "Arial, sans-serif", fontSize: panelTextSize(12), fontStyle: "bold", color: "#754444", letterSpacing: 2,
    }).setOrigin(0, 0.5).setDepth(5);
    this.add.text(panelX - panelW * 0.42, panelY - panelH * 0.3, "ตรวจสอบสภาพผิว", {
      fontFamily: this.uiFont, fontSize: panelTextSize(27), fontStyle: "bold", color: "#29251f",
    }).setOrigin(0, 0.5).setDepth(5);
    this.add.text(panelX + panelW * 0.42, panelY - panelH * 0.3, `${count}/${bodyAreas.length}`, {
      fontFamily: "Arial, sans-serif", fontSize: panelTextSize(18), fontStyle: "bold", color: count === bodyAreas.length ? "#557263" : "#754444",
    }).setOrigin(1, 0.5).setDepth(5);
    const trackX = panelX;
    const trackY = panelY - panelH * 0.21;
    const trackW = panelW * 0.84;
    this.add.rectangle(trackX, trackY, trackW, 8 * panelScale, 0xd8cbb2).setDepth(5);
    if (count > 0) this.add.rectangle(trackX - trackW * (1 - count / bodyAreas.length) / 2, trackY, trackW * count / bodyAreas.length, 8 * panelScale, 0x754444).setDepth(6);
    bodyAreas.forEach((area, index) => {
      const rowY = panelY - panelH * 0.13 + index * panelH * 0.075;
      const checked = this.checkedAreas.has(area.id);
      const active = this.lastCheckedAreaId === area.id;
      const rowColor = checked ? 0xe0eadb : active ? 0xf3e2b8 : 0xfffcf5;
      this.add.rectangle(panelX, rowY, panelW * 0.84, panelH * 0.07, rowColor, 0.96)
        .setStrokeStyle(active && !checked ? 2 : 1, checked ? 0x557263 : active ? 0xb38432 : 0xc7b99f)
        .setDepth(5);
      this.add.circle(panelX - panelW * 0.34, rowY, Math.min(16 * panelScale, panelH * 0.033), checked ? 0x557263 : active ? 0x754444 : 0x827661)
        .setStrokeStyle(1.5, checked ? 0xf2f5e9 : 0x39332a)
        .setDepth(6);
      this.add.text(panelX - panelW * 0.34, rowY, checked ? "✓" : `${index + 1}`, {
        fontFamily: "Arial, sans-serif", fontSize: panelTextSize(13), fontStyle: "bold", color: "#ffffff",
      }).setOrigin(0.5).setDepth(7);
      this.add.text(panelX - panelW * 0.25, rowY, area.label, {
        fontFamily: this.uiFont, fontSize: panelTextSize(17), fontStyle: "bold", color: "#29251f",
      }).setOrigin(0, 0.5).setDepth(6);
      this.add.text(panelX + panelW * 0.39, rowY, checked ? "ตรวจแล้ว" : "รอตรวจ", {
        fontFamily: this.uiFont, fontSize: panelTextSize(13), fontStyle: checked ? "bold" : "normal", color: checked ? "#557263" : "#756b5e",
      }).setOrigin(1, 0.5).setDepth(6);
    });

    const responseY = panelY + panelH * 0.395;
    this.add.rectangle(panelX, responseY, panelW * 0.84, panelH * 0.12, 0xf0e6d2)
      .setStrokeStyle(1.5, 0x9c8968)
      .setDepth(5);
    this.add.text(panelX - panelW * 0.38, responseY - panelH * 0.035, "ผลการตรวจ", {
      fontFamily: this.uiFont, fontSize: panelTextSize(12), fontStyle: "bold", color: "#754444",
    }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(panelX - panelW * 0.38, responseY + panelH * 0.018, this.response, {
      fontFamily: this.uiFont, fontSize: panelTextSize(14), color: "#29251f", wordWrap: { width: panelW * 0.74 },
    }).setOrigin(0, 0.5).setDepth(6);

    const instructionX = width * 0.88;
    const instructionY = height * 0.105;
    this.add.rectangle(instructionX, instructionY, Math.min(width * 0.22, 300), 40 * scale, 0xfaf6ed)
      .setStrokeStyle(1.5, 0x29251f)
      .setDepth(5);
    this.add.text(instructionX, instructionY, "แตะจุดสีส้มเพื่อตรวจผิว", {
      fontFamily: this.uiFont, fontSize: textSize(13), fontStyle: "bold", color: "#29251f",
    }).setOrigin(0.5).setDepth(6);
    const body = this.add.image(width * 0.68, height * 0.51, "skinAssessmentBody");
    const source = this.textures.get("skinAssessmentBody").getSourceImage() as HTMLImageElement;
    const bodyHeight = Math.min(height * 0.94, width * 0.7 * (source.height / source.width));
    body.setDisplaySize(bodyHeight * (source.width / source.height), bodyHeight).setDepth(2);
    const bodyLeft = body.x - body.displayWidth / 2;
    const bodyTop = body.y - body.displayHeight / 2;

    bodyAreas.forEach((area, index) => {
      const checked = this.checkedAreas.has(area.id);
      const markerX = bodyLeft + body.displayWidth * area.x;
      const markerY = bodyTop + body.displayHeight * area.y;
      this.add.circle(markerX, markerY, Math.max(23, 34 * scale), checked ? 0x55ad70 : 0xffa600, 0.28).setDepth(4);
      const marker = this.add
        .circle(
          markerX,
          markerY,
          Math.max(17, 24 * scale),
          checked ? 0x34814b : 0xffa600,
        )
        .setStrokeStyle(2.5, checked ? 0xd8ffe0 : 0x352a16)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      const markerLabel = this.add.text(markerX, markerY, checked ? "✓" : `${index + 1}`, {
        fontFamily: "Arial, sans-serif", fontSize: textSize(19), fontStyle: "bold", color: "#ffffff",
      }).setOrigin(0.5).setDepth(7);
      marker.on("pointerover", () => {
        marker.setScale(1.12);
        markerLabel.setScale(1.12);
      });
      marker.on("pointerout", () => {
        marker.setScale(1);
        markerLabel.setScale(1);
      });
      marker.on("pointerdown", () => {
        this.playClick();
        this.checkedAreas.add(area.id);
        this.lastCheckedAreaId = area.id;
        this.response = area.finding;
        this.draw();
      });
    });

    this.drawButton(
      width * 0.87,
      height * 0.9,
      Math.min(width * 0.23, 330 * scale),
      Math.max(56, height * 0.095),
      "ยืนยัน",
      () => this.confirm(),
      textSize(23),
    );
  };

  private drawButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    fontSize: string,
  ) {
    const shadow = this.add
      .rectangle(x, y + 3, width, height, 0x3f2523)
      .setDepth(7);
    const button = this.add
      .rectangle(x, y, width, height, 0x754444)
      .setStrokeStyle(1.5, 0x3f2523)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: this.uiFont,
        fontSize,
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(9);
    button.on("pointerover", () => {
      button.setFillStyle(0x875252);
      this.tweens.add({ targets: [button, text], y: y - 2, duration: 120, ease: "Sine.Out" });
      this.tweens.add({ targets: shadow, y: y + 1, duration: 120, ease: "Sine.Out" });
    });
    button.on("pointerout", () => {
      button.setFillStyle(0x754444);
      this.tweens.add({ targets: [button, text], y, duration: 120, ease: "Sine.Out" });
      this.tweens.add({ targets: shadow, y: y + 3, duration: 120, ease: "Sine.Out" });
    });
    button.on("pointerdown", () => {
      this.playClick();
      onClick();
    });
  }

  private confirm() {
    if (this.checkedAreas.size !== bodyAreas.length) {
      this.response = "กรุณาตรวจสอบจุดสีส้มให้ครบทุกบริเวณก่อนยืนยัน";
      this.draw();
      return;
    }
    this.registry.set("patientSkinAssessment", {
      completed: true,
      checkedAreas: bodyAreas.map(({ id, label, finding }) => ({ id, label, finding })),
    });
    this.registry.set("patientProcedure", "skin-check-complete");
    this.returnToProcedure();
  }

  private returnToProcedure() {
    this.scene.stop();
    this.scene.launch("PatientInteraction", { view: "procedure" });
  }

  private playClick() {
    if (this.cache.audio.exists("skinAssessmentClick")) {
      this.sound.play("skinAssessmentClick", { volume: 0.7 });
    }
  }
}
