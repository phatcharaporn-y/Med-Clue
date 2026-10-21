import Phaser from "phaser";
import { drawSettingsPanel } from "./SettingsPanel";

type Page = "pre-injection" | "injection-site" | "confirmation";
type Topic = { id: string; label: string; required: boolean; score: number };

const preInjectionTopics: Topic[] = [
  {
    id: "identity",
    label: "ยืนยันชื่อ-สกุลและวันเกิดของผู้ป่วย",
    required: true,
    score: 25,
  },
  {
    id: "wristband",
    label: "เทียบชื่อบนสายรัดข้อมือกับเวชระเบียน",
    required: true,
    score: 25,
  },
  {
    id: "medicine-purpose",
    label: "แจ้งชื่อยาและวัตถุประสงค์ของยา",
    required: true,
    score: 25,
  },
  {
    id: "decoy-1",
    label: "ถามเรื่องทั่วไปที่ไม่เกี่ยวกับการฉีดยา",
    required: false,
    score: 0,
  },
  {
    id: "decoy-2",
    label: "ถามว่าผู้ป่วยชอบอาหารชนิดใด",
    required: false,
    score: 0,
  },
  {
    id: "side-effects",
    label: "แจ้งผลข้างเคียงและอาการน้ำตาลต่ำ",
    required: true,
    score: 25,
  },
  {
    id: "decoy-3",
    label: "ถามเรื่องสภาพอากาศวันนี้",
    required: false,
    score: 0,
  },
  {
    id: "decoy-4",
    label: "ถามเรื่องรายการโทรทัศน์ที่ชอบ",
    required: false,
    score: 0,
  },
];

const injectionSites = [
  {
    id: "left-upper-arm",
    label: "ต้นแขนซ้าย",
    x: 0.8,
    y: 0.29,
    normal: false,
    score: 8,
  },
  {
    id: "right-upper-arm",
    label: "ต้นแขนขวา",
    x: 0.2,
    y: 0.29,
    normal: false,
    score: 8,
  },
  {
    id: "left-abdomen",
    label: "หน้าท้องซ้าย",
    x: 0.35,
    y: 0.46,
    normal: false,
    score: 10,
  },
  {
    id: "right-abdomen",
    label: "หน้าท้องขวา",
    x: 0.63,
    y: 0.46,
    normal: false,
    score: 10,
  },
  {
    id: "right-thigh",
    label: "ต้นขาขวา",
    x: 0.37,
    y: 0.62,
    normal: true,
    score: 25,
  },
  {
    id: "left-thigh",
    label: "ต้นขาซ้าย",
    x: 0.63,
    y: 0.62,
    normal: false,
    score: 8,
  },
] as const;

export class MedicationPatientFlowScene extends Phaser.Scene {
  private page: Page = "pre-injection";
  private selectedTopics = new Set<string>();
  private decidedTopics = new Set<string>();
  private topicIndex = 0;
  private selectedSite: string | null = null;
  private feedback = "เลือกแจ้งข้อมูลสำคัญแก่ผู้ป่วยให้ครบก่อนฉีดยา";
  private uiFont = "Arial, sans-serif";
  private settingsOpen = false;

  constructor() {
    super("MedicationPatientFlow");
  }

  preload() {
    this.load.image("medicationPatientBody", "/images/game/body.png");
    this.load.image("medicationPatientHint", "/images/game/hint.png");
    this.load.image(
      "medicationPatientSettings",
      "/images/game/setting_icon.png",
    );
    this.load.image(
      "medicationPatientSettingsFolder",
      "/images/game/floder_brown.png",
    );
    this.load.audio("medicationPatientClick", "/sounds/iconclick.wav");
  }

  create() {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.uiFont = `${promptFont}, Arial, sans-serif`;
    this.page = "pre-injection";
    this.selectedTopics = new Set();
    this.decidedTopics = new Set();
    this.topicIndex = 0;
    this.selectedSite = null;
    this.feedback = "เลือกแจ้งข้อมูลสำคัญแก่ผู้ป่วยให้ครบก่อนฉีดยา";
    this.settingsOpen = false;
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

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.54)
      .setDepth(0);
    this.addBack(width, height);

    if (this.page === "pre-injection")
      this.drawPreInjection(width, height, scale, textSize);
    if (this.page === "injection-site")
      this.drawInjectionSite(width, height, scale, textSize);
    if (this.page === "confirmation")
      this.drawConfirmation(width, height, textSize);
    if (!this.settingsOpen) {
      const setting = this.add.image(
        width - Math.max(48, width * 0.036),
        Math.max(44, height * 0.05),
        "medicationPatientSettings",
      );
      const source = this.textures
        .get("medicationPatientSettings")
        .getSourceImage() as HTMLImageElement;
      setting
        .setScale(Math.max(84, width * 0.072) / source.width)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });
      setting.on("pointerdown", () => {
        this.click();
        this.settingsOpen = true;
        this.draw();
      });
    } else {
      drawSettingsPanel(this, {
        fontFamily: this.uiFont,
        folderTextureKey: "medicationPatientSettingsFolder",
        exitLabel: "ออกจากเกม",
        onClose: () => {
          this.settingsOpen = false;
          this.draw();
        },
        onExit: () => {
          sessionStorage.removeItem("medclue-game-scene");
          this.scene.stop("GameRoom");
          this.scene.start("CaseBrief");
        },
      });
    }
  };

  private addBack(width: number, height: number) {
    this.add
      .text(
        Math.max(24, width * 0.025),
        Math.max(30, height * 0.045),
        `< ${this.page === "injection-site" || this.page === "confirmation" ? "ตำแหน่งฉีด" : "ให้ยา"}`,
        {
          fontFamily: this.uiFont,
          fontSize: `${Math.max(18, Math.min(26, height * 0.026))}px`,
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#151311",
          strokeThickness: 4,
        },
      )
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.click();
        if (this.page === "pre-injection") {
          this.returnToProcedure();
        } else if (this.page === "confirmation") {
          this.page = "injection-site";
          this.draw();
        } else {
          this.page = "pre-injection";
          this.draw();
        }
      });
  }

  private drawPreInjection(
    width: number,
    height: number,
    scale: number,
    textSize: (size: number) => string,
  ) {
    const cx = width / 2;
    const titleStyle = { fontFamily: this.uiFont, fontSize: textSize(25), fontStyle: "bold", color: "#ffffff", stroke: "#171411", strokeThickness: 5 };
    this.add.text(cx, height * 0.105, "สนทนาก่อนฉีดยา", titleStyle).setOrigin(0.5).setDepth(6);
    const topic = preInjectionTopics[this.topicIndex];
    const nurseBubbleY = height * 0.35;
    const patientBubbleY = height * 0.51;
    const nurseBubbleX = width * 0.28;
    const patientBubbleX = width * 0.72;
    const bubbleW = Math.min(width * 0.39, 560);
    const nurseBubbleH = Math.min(height * 0.17, 150);
    const patientBubbleH = Math.min(height * 0.12, 112);
    this.drawSpeakerTag(nurseBubbleX, nurseBubbleY - nurseBubbleH * 0.5 - 20 * scale, "พยาบาลแจ้ง", 0x743d31, textSize(14));
    this.drawSpeakerTag(patientBubbleX, patientBubbleY - patientBubbleH * 0.5 - 20 * scale, "ผู้ป่วยตอบ", 0x285a7a, textSize(14));
    this.drawSpeechBubble(nurseBubbleX, nurseBubbleY, bubbleW, nurseBubbleH, 0xffe9c9, 0x743d31, false);
    this.add.text(nurseBubbleX, nurseBubbleY, topic.label, {
      fontFamily: this.uiFont, fontSize: textSize(17), color: "#29251f", align: "center", wordWrap: { width: bubbleW - 42 },
    }).setOrigin(0.5).setDepth(9);
    const hasShared = this.selectedTopics.has(topic.id);
    this.drawSpeechBubble(patientBubbleX, patientBubbleY, bubbleW, patientBubbleH, 0xdcecf8, 0x285a7a, true);
    this.add.text(patientBubbleX, patientBubbleY, hasShared ? "ครับ รับทราบครับ" : "ครับ ผมกำลังฟังอยู่ครับ", {
      fontFamily: this.uiFont, fontSize: textSize(16), color: "#29251f", align: "center", wordWrap: { width: bubbleW - 42 },
    }).setOrigin(0.5).setDepth(9);
    const progressY = height * 0.655;
    const progressW = Math.min(width * 0.28, 360);
    this.add.rectangle(cx, progressY, progressW, 7 * scale, 0xffffff, 0.38).setDepth(5);
    this.add.rectangle(cx - progressW * (1 - (this.topicIndex + 1) / preInjectionTopics.length) / 2, progressY, progressW * (this.topicIndex + 1) / preInjectionTopics.length, 7 * scale, 0xf0c65b).setDepth(6);
    this.add.text(cx, progressY - 16 * scale, `หัวข้อ ${this.topicIndex + 1} / ${preInjectionTopics.length}`, { fontFamily: this.uiFont, fontSize: textSize(13), color: "#ffffff", stroke: "#171411", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(7);
    const optionY = height * 0.75;
    const optionW = Math.min(width * 0.3, 380);
    const optionH = Math.min(48 * scale, height * 0.066);
    this.drawTopicChoice(width * 0.4, optionY, optionW, optionH, "แจ้งข้อมูลนี้", hasShared, 0x338a58, textSize(16), () => {
      this.selectedTopics.add(topic.id);
      this.decidedTopics.add(topic.id);
      this.feedback = `แจ้งผู้ป่วยแล้ว: ${topic.label}`;
      this.draw();
    });
    const wasSkipped = this.decidedTopics.has(topic.id) && !hasShared;
    this.drawTopicChoice(width * 0.6, optionY, optionW, optionH, "ข้ามหัวข้อนี้", wasSkipped, 0xc18139, textSize(16), () => {
      this.selectedTopics.delete(topic.id);
      this.decidedTopics.add(topic.id);
      this.feedback = "ข้ามหัวข้อนี้แล้ว";
      this.draw();
    });
    const choiceStatus = this.feedback.startsWith("กรุณาแจ้ง")
      ? this.feedback
      : !this.decidedTopics.has(topic.id)
        ? "เลือกว่าจะ ‘แจ้งข้อมูลนี้’ หรือ ‘ข้ามหัวข้อนี้’"
        : hasShared ? "เลือกแล้ว: แจ้งข้อมูลนี้" : "เลือกแล้ว: ข้ามหัวข้อนี้";
    this.add.text(cx, height * 0.84, choiceStatus, {
      fontFamily: this.uiFont, fontSize: textSize(14), fontStyle: "bold",
      color: this.feedback.startsWith("กรุณาแจ้ง") ? "#ffd0bd" : this.decidedTopics.has(topic.id) ? "#fff2cf" : "#ffffff",
      stroke: "#171411", strokeThickness: 3, align: "center",
    }).setOrigin(0.5).setDepth(8);
    if (this.topicIndex > 0) this.button(width * 0.39, height * 0.94, width * 0.18, height * 0.065, "‹ ก่อนหน้า", () => {
      this.topicIndex -= 1;
      this.draw();
    }, textSize(15), false);
    if (this.topicIndex < preInjectionTopics.length - 1) this.button(width * 0.61, height * 0.94, width * 0.18, height * 0.065, "ถัดไป ›", () => {
      if (!this.decidedTopics.has(topic.id)) {
        this.feedback = "เลือกแจ้งหรือข้ามหัวข้อนี้ก่อนนะครับ";
        this.draw();
        return;
      }
      this.topicIndex += 1;
      this.draw();
    }, textSize(15), true);
    if (
      this.topicIndex === preInjectionTopics.length - 1 &&
      this.decidedTopics.has(topic.id)
    ) {
      this.button(
        width * 0.61,
        height * 0.94,
        width * 0.18,
        height * 0.065,
        "ยืนยัน",
        () => this.confirmTopics(),
        textSize(15),
      );
    }
  }

  private drawSpeechBubble(x: number, y: number, width: number, height: number, fill: number, border: number, tailRight: boolean) {
    const graphics = this.add.graphics().setDepth(7);
    graphics.fillStyle(fill, 1);
    graphics.lineStyle(2, border, 1);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 18);
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 18);
    const tailX = tailRight ? x + width * 0.34 : x - width * 0.34;
    const direction = tailRight ? 1 : -1;
    graphics.fillTriangle(tailX, y + height / 2 - 4, tailX + direction * 20, y + height / 2 + 18, tailX + direction * 35, y + height / 2 - 4);
    graphics.lineBetween(tailX, y + height / 2 - 3, tailX + direction * 20, y + height / 2 + 18);
    graphics.lineBetween(tailX + direction * 20, y + height / 2 + 18, tailX + direction * 35, y + height / 2 - 3);
  }

  private drawSpeakerTag(x: number, y: number, label: string, color: number, fontSize: string) {
    this.add.rectangle(x, y, 150, 30, color).setStrokeStyle(1.5, 0xffffff).setDepth(8);
    this.add.text(x, y, label, { fontFamily: this.uiFont, fontSize, fontStyle: "bold", color: "#ffffff" }).setOrigin(0.5).setDepth(9);
  }

  private drawTopicChoice(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    selected: boolean,
    selectedColor: number,
    textSize: string,
    action: () => void,
  ) {
    const face = this.add.rectangle(x, y, width, height, selected ? selectedColor : 0xfffaf0)
      .setStrokeStyle(selected ? 3 : 1.5, selected ? 0x20201d : 0x51493f)
      .setDepth(7)
      .setInteractive({ useHandCursor: true });
    const prefix = selected ? (label === "แจ้งข้อมูลนี้" ? "✓  " : "↷  ") : "";
    const text = this.add.text(x, y, `${prefix}${label}`, {
      fontFamily: this.uiFont,
      fontSize: textSize,
      fontStyle: "bold",
      color: selected && selectedColor === 0x338a58 ? "#ffffff" : "#28231d",
      align: "center",
      wordWrap: { width: width - 24 },
    }).setOrigin(0.5).setDepth(8);
    face.on("pointerover", () => {
      if (!selected) face.setFillStyle(0xf2e3c8);
    });
    face.on("pointerout", () => {
      face.setFillStyle(selected ? selectedColor : 0xfffaf0);
    });
    const click = () => {
      this.click();
      action();
    };
    face.on("pointerdown", click);
    text.setInteractive({ useHandCursor: true }).on("pointerdown", click);
  }

  private drawInjectionSite(
    width: number,
    height: number,
    scale: number,
    textSize: (size: number) => string,
  ) {
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
    this.add.text(panelX - panelW * 0.42, panelY - panelH * 0.39, "INJECTION SITE", {
      fontFamily: "Arial, sans-serif", fontSize: panelTextSize(12), fontStyle: "bold", color: "#754444", letterSpacing: 2,
    }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(panelX - panelW * 0.42, panelY - panelH * 0.3, "เลือกตำแหน่งฉีด", {
      fontFamily: this.uiFont, fontSize: panelTextSize(27), fontStyle: "bold", color: "#29251f",
    }).setOrigin(0, 0.5).setDepth(6);
    this.add.rectangle(panelX, panelY - panelH * 0.21, panelW * 0.84, 8 * panelScale, 0xd8cbb2).setDepth(5);

    const body = this.add.image(width * 0.68, height * 0.51, "medicationPatientBody");
    const source = this.textures
      .get("medicationPatientBody")
      .getSourceImage() as HTMLImageElement;
    const bodyHeight = Math.min(height * 0.94, width * 0.7 * (source.height / source.width));
    body
      .setDisplaySize((bodyHeight * source.width) / source.height, bodyHeight)
      .setDepth(2);
    const bodyLeft = body.x - body.displayWidth / 2;
    const bodyTop = body.y - body.displayHeight / 2;
    injectionSites.forEach((site, index) => {
      const selected = this.selectedSite === site.id;
      const markerX = bodyLeft + body.displayWidth * site.x;
      const markerY = bodyTop + body.displayHeight * site.y;
      const rowY = panelY - panelH * 0.13 + index * panelH * 0.075;
      this.add.rectangle(panelX, rowY, panelW * 0.84, panelH * 0.07, selected ? 0xf0e0b6 : 0xfffcf5)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0xb38432 : 0xc7b99f)
        .setDepth(5);
      this.add.circle(panelX - panelW * 0.34, rowY, Math.min(16 * panelScale, panelH * 0.03), selected ? 0x754444 : 0x827661)
        .setStrokeStyle(1.5, 0x39332a)
        .setDepth(6);
      this.add.text(panelX - panelW * 0.34, rowY, selected ? "✓" : `${index + 1}`, {
        fontFamily: "Arial, sans-serif", fontSize: panelTextSize(13), fontStyle: "bold", color: "#ffffff",
      }).setOrigin(0.5).setDepth(7);
      this.add.text(panelX - panelW * 0.25, rowY, site.label, {
        fontFamily: this.uiFont, fontSize: panelTextSize(17), fontStyle: "bold", color: "#29251f",
      }).setOrigin(0, 0.5).setDepth(6);
      this.add.text(panelX + panelW * 0.39, rowY, selected ? "เลือกแล้ว" : "", {
        fontFamily: this.uiFont, fontSize: panelTextSize(12), fontStyle: "bold", color: "#754444",
      }).setOrigin(1, 0.5).setDepth(6);
      this.add.circle(markerX, markerY, Math.max(23, 34 * scale), selected ? 0x754444 : 0xffa600, 0.25).setDepth(4);
      const marker = this.add
        .circle(
          markerX,
          markerY,
          Math.max(17, 24 * scale),
          selected ? 0x754444 : 0xffa600,
        )
        .setStrokeStyle(2.5, selected ? 0xfaf6ed : 0x352a16)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      const markerText = this.add.text(markerX, markerY, selected ? "✓" : `${index + 1}`, {
        fontFamily: "Arial, sans-serif", fontSize: textSize(16), fontStyle: "bold", color: "#ffffff",
      }).setOrigin(0.5).setDepth(7);
      marker.on("pointerover", () => { marker.setScale(1.1); markerText.setScale(1.1); });
      marker.on("pointerout", () => { marker.setScale(1); markerText.setScale(1); });
      marker.on("pointerdown", () => {
        this.click();
        this.selectedSite = site.id;
        this.feedback = `เลือกตำแหน่งฉีด: ${site.label}`;
        this.draw();
      });
    });
    const statusY = panelY + panelH * 0.395;
    this.add.rectangle(panelX, statusY, panelW * 0.84, panelH * 0.12, 0xf0e6d2)
      .setStrokeStyle(1.5, 0x9c8968)
      .setDepth(5);
    this.add.text(panelX - panelW * 0.38, statusY - panelH * 0.025, "สถานะ", {
      fontFamily: this.uiFont, fontSize: panelTextSize(12), fontStyle: "bold", color: "#754444",
    }).setOrigin(0, 0.5).setDepth(6);
    this.add.text(panelX - panelW * 0.38, statusY + panelH * 0.018, this.feedback.startsWith("กรุณา") ? this.feedback : this.selectedSite ? this.feedback : "ยังไม่ได้เลือกตำแหน่งฉีด", {
      fontFamily: this.uiFont, fontSize: panelTextSize(14), color: "#29251f", wordWrap: { width: panelW * 0.74 },
    }).setOrigin(0, 0.5).setDepth(6);
    this.button(
      width * 0.87,
      height * 0.9,
      Math.min(width * 0.23, 330 * scale),
      Math.max(56, height * 0.095),
      "ยืนยัน",
      () => {
        if (!this.selectedSite) {
          this.feedback = "กรุณาเลือกตำแหน่งฉีดยาก่อนยืนยัน";
          this.draw();
          return;
        }
        this.page = "confirmation";
        this.draw();
      },
      textSize(23),
    );
  }

  private drawConfirmation(
    width: number,
    height: number,
    textSize: (size: number) => string,
  ) {
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.34)
      .setDepth(10);
    const w = Math.min(width * 0.46, 660);
    const h = Math.min(height * 0.5, 360);
    const cx = width / 2;
    const cy = height / 2;
    this.paper(cx, cy, w, h, 11);
    const preparation = this.registry.get("medicationPreparation") ?? {};
    const site = injectionSites.find((entry) => entry.id === this.selectedSite);
    const patient = "นายธนกฤต วัฒนากุล · HN 69031427";
    const medication = "Regular insulin U-100";
    const dose =
      preparation.calculatedDose == null
        ? "ยังไม่ได้คำนวณ"
        : `${preparation.calculatedDose} units · SC`;
    this.add
      .text(cx, cy - h * 0.36, "Confirm Medication", {
        fontFamily: this.uiFont,
        fontSize: textSize(22),
        fontStyle: "bold",
        color: "#29251f",
      })
      .setOrigin(0.5)
      .setDepth(13);
    const rows = [
      ["ยา", medication],
      ["ผู้ป่วย", patient],
      ["ขนาด / route", dose],
      ["ตำแหน่ง", site?.label ?? "ยังไม่ได้เลือก"],
    ];
    rows.forEach(([label, value], index) => {
      const y = cy - h * 0.17 + index * h * 0.105;
      this.add
        .text(cx - w * 0.42, y, label, {
          fontFamily: this.uiFont,
          fontSize: textSize(13),
          fontStyle: "bold",
          color: "#302a22",
        })
        .setDepth(13);
      this.add
        .text(cx - w * 0.02, y, value, {
          fontFamily: this.uiFont,
          fontSize: textSize(13),
          color: "#302a22",
        })
        .setDepth(13);
    });
    this.button(
      cx - w * 0.2,
      cy + h * 0.32,
      w * 0.3,
      Math.max(42, h * 0.17),
      "ย้อนกลับ",
      () => {
        this.page = "injection-site";
        this.draw();
      },
      textSize(15),
      false,
      14,
    );
    this.button(
      cx + w * 0.2,
      cy + h * 0.32,
      w * 0.34,
      Math.max(42, h * 0.17),
      "ยืนยันฉีดยา",
      () => this.administer(),
      textSize(15),
      true,
      14,
    );
  }

  private paper(
    x: number,
    y: number,
    width: number,
    height: number,
    depth = 3,
  ) {
    this.add
      .rectangle(x + 3, y + 4, width, height, 0x171411, 0.35)
      .setDepth(depth);
    this.add
      .rectangle(x, y, width, height, 0xf4eddd)
      .setStrokeStyle(2, 0x29251f)
      .setDepth(depth + 1);
    this.add
      .rectangle(x, y, width - 10, height - 10, 0xfaf7ef)
      .setStrokeStyle(1, 0xc6b99f)
      .setDepth(depth + 2);
  }

  private drawHint(
    x: number,
    y: number,
    width: number,
    textSize: (size: number) => string,
    message = this.feedback,
  ) {
    const panelWidth = Math.min(width, this.scale.width * 0.42);
    this.add
      .rectangle(x, y, panelWidth, 38, 0xfaf7ef)
      .setStrokeStyle(1.5, 0x29251f)
      .setDepth(6);
    this.add
      .image(x - panelWidth / 2 + 16, y - 10, "medicationPatientHint")
      .setDisplaySize(30, 42)
      .setDepth(7);
    this.add
      .text(x - panelWidth / 2 + 37, y, message, {
        fontFamily: this.uiFont,
        fontSize: textSize(13),
        color: "#29251f",
        wordWrap: { width: panelWidth - 45 },
      })
      .setOrigin(0, 0.5)
      .setDepth(7);
  }

  private button(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    action: () => void,
    textSize: string,
    primary = true,
    depth = 7,
  ) {
    const shadow = this.add
      .rectangle(x, y + 3, width, height, primary ? 0x3f2523 : 0x554f47)
      .setDepth(depth);
    const face = this.add
      .rectangle(x, y, width, height, primary ? 0x754444 : 0xfaf7ef)
      .setStrokeStyle(1.5, primary ? 0x3f2523 : 0x29251f)
      .setDepth(depth + 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: this.uiFont,
        fontSize: textSize,
        fontStyle: "bold",
        color: primary ? "#ffffff" : "#29251f",
      })
      .setOrigin(0.5)
      .setDepth(depth + 2);
    face.on("pointerover", () => {
      face.setFillStyle(primary ? 0x875252 : 0xeee5d6);
      this.tweens.add({
        targets: [face, text],
        y: y - 2,
        duration: 120,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: shadow,
        y: y + 1,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    face.on("pointerout", () => {
      face.setFillStyle(primary ? 0x754444 : 0xfaf7ef);
      this.tweens.add({
        targets: [face, text],
        y,
        duration: 120,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: shadow,
        y: y + 3,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    const click = () => {
      this.click();
      action();
    };
    face.on("pointerdown", click);
    text.setInteractive({ useHandCursor: true }).on("pointerdown", click);
  }

  private confirmTopics() {
    const required = preInjectionTopics.filter((topic) => topic.required);
    if (!required.every((topic) => this.selectedTopics.has(topic.id))) {
      this.feedback =
        "กรุณาแจ้งยืนยันตัวผู้ป่วย เทียบสายรัดข้อมือ ชื่อยา/วัตถุประสงค์ และผลข้างเคียงให้ครบ";
      this.draw();
      return;
    }
    const previous = this.registry.get("patientConversationRounds") ?? {};
    this.registry.set("patientConversationRounds", {
      ...previous,
      beforeMedicationCompleted: true,
      beforeMedicationScore: required.reduce(
        (sum, topic) => sum + topic.score,
        0,
      ),
      beforeMedicationMaxScore: 100,
      beforeMedicationTopics: preInjectionTopics
        .filter((topic) => this.selectedTopics.has(topic.id))
        .map(({ id, label, score, required: isRequired }) => ({
          id,
          label,
          score,
          required: isRequired,
        })),
    });
    this.page = "injection-site";
    this.feedback = "ยังไม่ได้เลือกตำแหน่งฉีด";
    this.draw();
  }

  private administer() {
    const site = injectionSites.find((entry) => entry.id === this.selectedSite);
    if (!site) return;
    const previous = this.registry.get("medicationPreparation") ?? {};
    this.registry.set("medicationPreparation", {
      ...previous,
      administered: true,
      injectionSite: site.id,
      administrationConfirmed: true,
    });
    this.registry.set("patientMedicationAdministered", true);
    this.registry.set("patientInjectionSite", {
      id: site.id,
      label: site.label,
      score: site.score,
      maxScore: 25,
    });
    this.returnToGameRoom();
  }

  private returnToGameRoom() {
    this.scene.stop();
    this.scene.resume("GameRoom");
  }

  private returnToProcedure() {
    this.scene.stop();
    this.scene.launch("PatientInteraction", { view: "procedure" });
  }

  private click() {
    if (this.cache.audio.exists("medicationPatientClick")) {
      this.sound.play("medicationPatientClick", { volume: 0.7 });
    }
  }
}
