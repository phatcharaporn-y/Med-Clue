import Phaser from "phaser";

const missionTasks = [
  "บริหารยา Regular Insulin อย่างถูกต้องตามหลัก 10R",
  "ตรวจระดับน้ำตาลในเลือด",
  "เลือกชนิดและขนาดยา",
  "ประเมินความพร้อมในการรับประทานอาหาร",
  "ติดตามอาการหลังให้ยา",
];

type PatientPage = 1 | 2;

export class CaseBriefScene extends Phaser.Scene {
  private patientPage: PatientPage = 1;
  private settingsOpen = false;
  private started = false;
  private completedTasks = new Set<number>();
  private uiFontFamily = "Arial, sans-serif";

  constructor() {
    super("CaseBrief");
  }

  preload() {
    this.load.image("board", "/images/game/board.png");
    this.load.image("patientFolder", "/images/game/floder_blue.png");
    this.load.image("missionFolder", "/images/game/แฟ้มสีน้ำเงินกับกองเอกสารเปล่า.png");
    this.load.image("arrow", "/images/game/arrow.png");
    this.load.image("settings", "/images/game/setting_icon.png");
    this.load.image("hospitalRoom", "/images/game/bg_new.png");
    this.load.audio("pageFlip", "/sounds/page-flip.wav");
    this.load.audio("startGame", "/sounds/startgame.wav");
    this.load.audio("iconClick", "/sounds/iconclick.wav");
  }

  create() {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.uiFontFamily = `${promptFont}, Arial, sans-serif`;
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.draw();
  }

  private handleResize() {
    this.draw();
  }

  private draw() {
    this.children.removeAll(true);
    if (this.started) this.drawMission();
    else this.drawBrief();
    if (this.settingsOpen) this.drawSettings();
  }

  private drawBoard(width: number, height: number) {
    const bg = this.add.image(width / 2, height / 2, "board");
    const source = this.textures.get("board").getSourceImage() as HTMLImageElement;
    // board.png contains transparent side margins; size from its visible artwork bounds.
    const visibleArtworkWidth = source.width * 0.7833;
    const visibleArtworkHeight = source.height * 0.98;
    const coverScale = Math.max(width / visibleArtworkWidth, height / visibleArtworkHeight) * 0.82;
    bg.setScale(coverScale).setAlpha(1).setDepth(0);
    this.add.rectangle(width / 2, height / 2, width, height, 0x17120f, 0.22).setDepth(1);
  }

  private drawBrief() {
    const width = this.scale.width;
    const height = this.scale.height;
    const scale = Math.min(width / 1728, height / 1060);
    const textScale = Math.max(0.68, Math.min(1, scale));
    this.drawBoard(width, height);

    const titleSize = Math.max(34, Math.min(66, height * 0.064));
    const titleY = height * 0.064;
    const titleW = Math.min(width * 0.34, 520);
    const titleH = Math.max(68, height * 0.095);
    this.add.rectangle(width / 2, titleY + 6, titleW + 12, titleH + 10, 0x2a170e, 0.82)
      .setDepth(6);
    this.add.rectangle(width / 2, titleY, titleW + 6, titleH + 6, 0x57331c)
      .setStrokeStyle(3, 0x321c10)
      .setDepth(7);
    this.add.rectangle(width / 2, titleY, titleW, titleH, 0x916039)
      .setStrokeStyle(2, 0xd6a56a)
      .setDepth(8);
    this.add.rectangle(width / 2, titleY - titleH * 0.34, titleW * 0.84, 2, 0xf1c88c, 0.56)
      .setDepth(8);
    this.add.rectangle(width / 2, titleY - titleH * 0.16, titleW * 0.84, 1, 0x58391f, 0.42)
      .setDepth(8);
    this.add.rectangle(width / 2, titleY + titleH * 0.31, titleW * 0.84, 1, 0xd2a16a, 0.36)
      .setDepth(8);
    this.add.circle(width / 2 - titleW * 0.43, titleY, 5, 0xc89a62)
      .setStrokeStyle(1, 0x4b2a16)
      .setDepth(9);
    this.add.circle(width / 2 + titleW * 0.43, titleY, 5, 0xc89a62)
      .setStrokeStyle(1, 0x4b2a16)
      .setDepth(9);
    this.add.text(width / 2, titleY, "CASE BRIEF", {
      fontFamily: this.uiFontFamily,
      fontSize: titleSize + "px",
      fontStyle: "bold",
      color: "#fff1d5",
      stroke: "#4b2a16",
      strokeThickness: 4,
      shadow: { color: "#08182a", blur: 5, fill: true, offsetX: 0, offsetY: 3 },
    }).setOrigin(0.5).setDepth(9);

    const patientX = width * 0.265;
    const patientY = height * 0.53;
    const patientH = height * 0.9;
    const patientImage = this.add.image(patientX, patientY, "patientFolder");
    patientImage.setScale(patientH / patientImage.height).setDepth(3);

    const missionX = width * 0.755;
    const missionY = height * 0.53;
    const missionW = width * 0.40;
    const missionImage = this.add.image(missionX, missionY, "missionFolder");
    missionImage.setScale(missionW / missionImage.width).setDepth(3);

    this.drawSettingsButton(width, height);

    this.drawDesktopBrief(width, height, textScale);
  }

  private drawDesktopBrief(width: number, height: number, textScale: number) {
    const titleFont = Math.max(18, Math.round(23 * textScale));
    const bodyFont = Math.max(15, Math.round(20 * textScale));
    const patientTextOffset = width * 0.04;
    const leftX = width * 0.112 + patientTextOffset;
    const valueX = width * 0.2 + patientTextOffset;

    this.add.text(width * 0.161 + patientTextOffset, height * 0.25, "Patient Information (" + this.patientPage + "/2)", {
      fontFamily: this.uiFontFamily,
      fontSize: titleFont + "px",
      fontStyle: "bold",
      color: "#211d1a",
    }).setDepth(6);

    if (this.patientPage === 1) {
      const rows = [
        ["ชื่อ-สกุล", "นายธนกฤต วัฒนากุล", 0.32],
        ["อายุ/เพศ", "68ปี/ชาย", 0.37],
        ["HN/AN/เตียง", "69031427 / 69001234 / เตียง 11\nหอผู้ป่วยอายุรกรรม", 0.415],
        ["น้ำหนัก/ส่วนสูง", "62kg/165cm(BMI 22.8)", 0.493],
        ["ประวัติแพ้ยา", "ไม่มีประวัติแพ้ยา", 0.538],
        ["การวินิจฉัยโรคปัจจุบัน", "Type 2 Diabetes Mellitus\nwith Hyperglycemia", 0.583],
        ["CC", "อ่อนเพลีย ปัสสาวะบ่อย กระหายน้ำ\n1 วันก่อนมาโรงพยาบาล", 0.658],
      ] as const;

      rows.forEach(([label, value, y]) => {
        this.add.text(leftX, height * y, label, {
          fontFamily: this.uiFontFamily,
          fontSize: bodyFont + "px",
          fontStyle: "bold",
          color: "#211d1a",
          wordWrap: { width: width * 0.12 },
          lineSpacing: 4,
        }).setDepth(6);
        this.add.text(valueX, height * y, value, {
          fontFamily: this.uiFontFamily,
          fontSize: bodyFont + "px",
          color: "#292521",
          wordWrap: { width: width * 0.235 },
          lineSpacing: 4,
        }).setDepth(6);
      });
    } else {
      this.add.text(leftX, height * 0.32, "ข้อมูลเพิ่มเติม", {
        fontFamily: this.uiFontFamily,
        fontSize: bodyFont + "px",
        fontStyle: "bold",
        color: "#211d1a",
      }).setDepth(6);
      this.add.text(valueX, height * 0.32, "ไม่มีข้อมูลเพิ่มเติมในเอกสารหน้านี้", {
        fontFamily: this.uiFontFamily,
        fontSize: bodyFont + "px",
        color: "#292521",
        wordWrap: { width: width * 0.235 },
      }).setDepth(6);
    }

    const missionFont = Math.max(16, Math.round(21 * textScale));
    this.add.text(width * 0.755, height * 0.31, "MISSION / TASK", {
      fontFamily: this.uiFontFamily,
      fontSize: missionFont + "px",
      fontStyle: "bold",
      color: "#211d1a",
    }).setOrigin(0.5, 0).setDepth(6);

    const taskFont = Math.max(15, Math.round(19 * textScale));
    const taskStartY = height * 0.385;
    const taskGap = height * 0.065;
    missionTasks.forEach((task, index) => {
      const y = taskStartY + index * taskGap;
      this.add.text(width * 0.638, y, String(index + 1), {
        fontFamily: this.uiFontFamily,
        fontSize: taskFont + "px",
        color: "#292521",
      }).setDepth(6);
      this.add.text(width * 0.662, y, task, {
        fontFamily: this.uiFontFamily,
        fontSize: taskFont + "px",
        color: "#292521",
        wordWrap: { width: width * 0.22 },
        lineSpacing: 3,
      }).setDepth(6);
    });

    this.drawStartButton(width, height, textScale, height * 0.733);
    this.drawPageArrow(width, height, textScale);
  }

  private drawPageArrow(width: number, height: number, textScale: number, y = height * 0.89) {
    const arrow = this.add.image(width * 0.376, y, "arrow")
      .setScale((Math.max(90, 150 * textScale)) / this.textures.get("arrow").getSourceImage().width)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    arrow.setFlipX(this.patientPage === 2);
    arrow.on("pointerdown", () => {
      this.sound.play("pageFlip", { volume: 1.0 });
      this.patientPage = this.patientPage === 1 ? 2 : 1;
      this.draw();
    });
  }

  private drawSettingsButton(width: number, height: number) {
    this.add.image(width - Math.max(48, width * 0.036), Math.max(44, height * 0.05), "settings")
      .setScale(Math.max(84, width * 0.072) / this.textures.get("settings").getSourceImage().width)
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("iconClick", { volume: 1.0 });
        this.settingsOpen = !this.settingsOpen;
        this.draw();
      });
  }

  private drawStartButton(width: number, height: number, textScale: number, y = height * 0.71) {
    const buttonW = Math.min(width * 0.205, 360 * textScale);
    const buttonH = Math.max(48, 68 * textScale);
    const x = width * 0.744;
    this.add.rectangle(x, y + 3, buttonW, buttonH, 0x3f2523)
      .setDepth(9);
    const button = this.add.rectangle(x, y, buttonW, buttonH, 0x754444)
      .setStrokeStyle(1.5, 0x3f2523)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    const playIcon = this.add.text(x - buttonW * 0.13, y, "▶", {
      fontFamily: this.uiFontFamily,
      fontSize: Math.max(18, 25 * textScale) + "px",
      color: "#ffffff",
    }).setOrigin(0.5).setDepth(11);
    const label = this.add.text(x + buttonW * 0.06, y, "เริ่มเล่น", {
      fontFamily: this.uiFontFamily,
      fontSize: Math.max(17, 22 * textScale) + "px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5).setDepth(11);

    button.on("pointerover", () => {
      button.setFillStyle(0x875252);
      this.tweens.add({ targets: [button, playIcon, label], y: y - 2, duration: 120, ease: "Sine.Out" });
    });
    button.on("pointerout", () => {
      button.setFillStyle(0x754444);
      this.tweens.add({ targets: [button, playIcon, label], y, duration: 120, ease: "Sine.Out" });
    });
    const startMission = () => {
      this.sound.play("startGame", { volume: 1 });
      this.started = true;
      this.draw();
    };
    button.on("pointerdown", startMission);
    playIcon.setInteractive({ useHandCursor: true }).on("pointerdown", startMission);
    label.setInteractive({ useHandCursor: true }).on("pointerdown", startMission);
  }

  private drawMission() {
    const width = this.scale.width;
    const height = this.scale.height;
    const fontScale = Math.max(0.72, Math.min(1, Math.min(width / 1728, height / 1060)));

    const room = this.add.image(width / 2, height / 2, "hospitalRoom");
    const roomSource = this.textures.get("hospitalRoom").getSourceImage() as HTMLImageElement;
    room.setScale(Math.max(width / roomSource.width, height / roomSource.height)).setDepth(0);
    this.add.rectangle(width / 2, height / 2, width, height, 0x101810, 0.25).setDepth(1);

    this.add.text(width / 2, height * 0.06, "MISSION / TASK", {
      fontFamily: this.uiFontFamily,
      fontSize: Math.max(30, 52 * fontScale) + "px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#17251d",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(width / 2, height * 0.12, "เลือกภารกิจเพื่อทำเครื่องหมายว่าเสร็จ", {
      fontFamily: this.uiFontFamily,
      fontSize: Math.max(16, 22 * fontScale) + "px",
      color: "#ffffff",
    }).setOrigin(0.5).setDepth(5);

    const cardW = Math.min(width * 0.55, 900);
    const rowH = Math.max(58, 74 * fontScale);
    const startY = height * 0.24;
    missionTasks.forEach((task, index) => {
      const x = width / 2;
      const y = startY + index * (rowH + 12 * fontScale);
      const complete = this.completedTasks.has(index);
      const row = this.add.rectangle(x, y, cardW, rowH, complete ? 0xd9eadb : 0xf5ead4, 0.97)
        .setStrokeStyle(2, complete ? 0x4c8c5a : 0x4d3829)
        .setDepth(5)
        .setInteractive({ useHandCursor: true });
      this.add.text(x - cardW * 0.44, y, complete ? "✓" : String(index + 1), {
        fontFamily: this.uiFontFamily,
        fontSize: Math.max(20, 25 * fontScale) + "px",
        fontStyle: "bold",
        color: complete ? "#2d7441" : "#4d3829",
      }).setOrigin(0.5).setDepth(6);
      this.add.text(x - cardW * 0.36, y, task, {
        fontFamily: this.uiFontFamily,
        fontSize: Math.max(15, 18 * fontScale) + "px",
        color: "#28211c",
        wordWrap: { width: cardW * 0.72 },
        lineSpacing: 2,
      }).setOrigin(0, 0.5).setDepth(6);
      row.on("pointerdown", () => {
        if (this.completedTasks.has(index)) this.completedTasks.delete(index);
        else this.completedTasks.add(index);
        this.draw();
      });
    });

    this.add.text(width / 2, height * 0.77, "ภารกิจที่เสร็จ " + this.completedTasks.size + "/5    คะแนน " + (this.completedTasks.size * 20) + "/100", {
      fontFamily: this.uiFontFamily,
      fontSize: Math.max(17, 24 * fontScale) + "px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#17251d",
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6);

    const back = this.add.text(width * 0.12, height * 0.06, "← CASE BRIEF", {
      fontFamily: this.uiFontFamily,
      fontSize: Math.max(15, 19 * fontScale) + "px",
      fontStyle: "bold",
      color: "#ffffff",
      backgroundColor: "#553b30",
      padding: { x: 12, y: 10 },
    }).setOrigin(0, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => {
      this.started = false;
      this.draw();
    });

    this.drawSettingsButton(width, height);
  }

  private drawSettings() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.48).setDepth(30);
    this.add.rectangle(width / 2, height / 2, Math.min(500, width * 0.8), 220, 0xf4ead7)
      .setStrokeStyle(3, 0x34231b)
      .setDepth(31);
    this.add.text(width / 2, height / 2 - 35, "การตั้งค่า", {
      fontFamily: this.uiFontFamily,
      fontSize: "28px",
      fontStyle: "bold",
      color: "#261d18",
    }).setOrigin(0.5).setDepth(32);
    const close = this.add.text(width / 2, height / 2 + 45, "ปิด", {
      fontFamily: this.uiFontFamily,
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#754444",
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });
    const home = this.add.text(width / 2, height / 2 + 84, "กลับหน้าหลัก", {
      fontFamily: this.uiFontFamily,
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#2463eb",
      padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });
    home.on("pointerdown", () => {
      this.sound.play("iconClick", { volume: 1.0 });
      window.location.assign("/");
    });
    close.on("pointerdown", () => {
      this.sound.play("iconClick", { volume: 1.0 });
      this.settingsOpen = false;
      this.draw();
    });
  }
}

