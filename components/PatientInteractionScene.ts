import Phaser from "phaser";
import { drawSettingsPanel } from "./SettingsPanel";

type PatientView =
  | "profile"
  | "initial-interview"
  | "post-med-interview"
  | "procedure";
type InterviewOption = { text: string; response: string; score: number };

const interviewQuestions = [
  {
    title: "คำถามที่ 1",
    prompt: "ข้อมูลยืนยันตัวผู้ป่วย",
    options: [
      {
        text: "ชื่ออะไร/วันเกิด",
        response: "ผมชื่อนายธนกฤต วัฒนากุลครับ อายุ 68 ปี",
        score: 25,
      },
      {
        text: "ขอทราบชื่อ-นามสกุล",
        response: "ผมชื่อนายธนกฤต วัฒนากุลครับ",
        score: 18,
      },
      { text: "ขอทราบ HN", response: "HN ของผมคือ 69031427 ครับ", score: 10 },
    ],
  },
  {
    title: "คำถามที่ 2",
    prompt: "อาการในขณะนี้",
    options: [
      {
        text: "วันนี้รู้สึกอย่างไรบ้าง",
        response: "ผมรู้สึกอ่อนเพลีย กระหายน้ำ แล้วก็ปัสสาวะบ่อยครับ",
        score: 25,
      },
      {
        text: "มีอาการอะไรเพิ่มเติมไหม",
        response: "ช่วงนี้ผมกระหายน้ำและปัสสาวะบ่อยครับ",
        score: 18,
      },
      {
        text: "มีอาการปวดตรงไหนไหม",
        response: "ไม่ได้ปวดตรงไหนครับ แต่รู้สึกอ่อนเพลีย",
        score: 10,
      },
    ],
  },
  {
    title: "คำถามที่ 3",
    prompt: "ประวัติการแพ้ยา",
    options: [
      {
        text: "มีอาการแพ้ยาอะไรไหมคะ",
        response: "ผมไม่มีประวัติแพ้ยาครับ",
        score: 25,
      },
      {
        text: "เคยแพ้อะไรไหมคะ",
        response: "ไม่เคยมีอาการแพ้ยาที่ทราบครับ",
        score: 18,
      },
      {
        text: "มียาที่ทานประจำไหมคะ",
        response: "ผมรักษาโรคเบาหวานอยู่ครับ",
        score: 10,
      },
    ],
  },
  {
    title: "คำถามที่ 4",
    prompt: "ความพร้อมก่อนรับยา",
    options: [
      {
        text: "ทานข้าวหรือยัง",
        response: "วันนี้ผมยังไม่ได้ทานข้าวครับ",
        score: 25,
      },
      {
        text: "มื้อสุดท้ายทานเมื่อไร",
        response: "มื้อสุดท้ายของผมคือมื้อก่อนหน้าครับ",
        score: 18,
      },
      {
        text: "ปกติทานอาหารได้ไหม",
        response: "ปกติผมทานอาหารได้ครับ",
        score: 10,
      },
    ],
  },
];

const postMedicationQuestions = [
  {
    title: "คำถามที่ 1",
    prompt: "อาการหลังได้รับยา",
    options: [
      {
        text: "หลังฉีดยารู้สึกเป็นอย่างไรบ้าง",
        response: "ตอนนี้ผมรู้สึกปกติดีครับ",
        score: 25,
      },
      {
        text: "อยากพักผ่อนไหมครับ",
        response: "ขอพักสักครู่ก็ดีครับ",
        score: 18,
      },
      { text: "หิวข้าวหรือยังครับ", response: "ยังไม่ค่อยหิวครับ", score: 10 },
    ],
  },
  {
    title: "คำถามที่ 2",
    prompt: "เฝ้าระวังอาการไม่พึงประสงค์",
    options: [
      {
        text: "มีใจสั่น มือสั่น เหงื่อออก หรือหน้ามืดไหม",
        response: "ไม่มีอาการเหล่านี้ครับ",
        score: 25,
      },
      { text: "รู้สึกเวียนหัวไหมครับ", response: "ไม่เวียนหัวครับ", score: 18 },
      { text: "รู้สึกง่วงไหมครับ", response: "ไม่ง่วงครับ", score: 10 },
    ],
  },
  {
    title: "คำถามที่ 3",
    prompt: "สังเกตบริเวณฉีดยา",
    options: [
      {
        text: "บริเวณที่ฉีดปวด บวม หรือแดงไหม",
        response: "บริเวณที่ฉีดไม่ปวด ไม่บวมครับ",
        score: 25,
      },
      { text: "ยังจำได้ไหมว่าฉีดตรงไหน", response: "จำได้ครับ", score: 18 },
      {
        text: "รู้สึกเย็นตรงที่ฉีดไหม",
        response: "ไม่รู้สึกเย็นครับ",
        score: 10,
      },
    ],
  },
  {
    title: "คำถามที่ 4",
    prompt: "ความเข้าใจในการแจ้งอาการ",
    options: [
      {
        text: "ถ้ามีอาการผิดปกติจะแจ้งพยาบาลทันทีนะครับ เข้าใจไหม",
        response: "เข้าใจครับ ถ้ามีอาการจะรีบแจ้งพยาบาล",
        score: 25,
      },
      {
        text: "มีอะไรอยากถามเพิ่มเติมไหมครับ",
        response: "ตอนนี้ยังไม่มีครับ",
        score: 18,
      },
      { text: "พักผ่อนได้เลยนะครับ", response: "ครับ ขอบคุณครับ", score: 10 },
    ],
  },
];

// ปรับค่าเพื่อเปลี่ยนตำแหน่งและขนาดของป้ายผู้ป่วย
const PATIENT_TAG_LAYOUT = {
  x: 0.5,
  y: 0.36,
  width: 390,
  textOffsetX: 0,
  textOffsetY: 0.025,
};

export class PatientInteractionScene extends Phaser.Scene {
  private view: PatientView = "profile";
  private initialView: PatientView = "profile";
  private selectedAnswers: string[] = [];
  private initialQuestionIndex = 0;
  private uiFont = "Arial, sans-serif";
  private answerText = "เลือกคำถามเพื่อสนทนากับผู้ป่วย";
  private settingsOpen = false;

  constructor() {
    super("PatientInteraction");
  }

  preload() {
    this.load.image("patientNameTag", "/images/game/nametag.png");
    this.load.image(
      "patientInteractionSettings",
      "/images/game/setting_icon.png",
    );
    this.load.image(
      "patientInteractionSettingsFolder",
      "/images/game/floder_brown.png",
    );
    this.load.audio("patientInteractionClick", "/sounds/iconclick.wav");
  }

  init(data: { view?: PatientView } = {}) {
    this.initialView = data.view ?? "profile";
  }

  create() {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.uiFont = `${promptFont}, Arial, sans-serif`;
    this.view = this.initialView;
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
    const fontSize = (size: number) => `${Math.max(12, size * scale)}px`;
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.54)
      .setDepth(1);

    if (this.view === "profile") {
      this.addBack("ผู้ป่วย", "room", width, height);
      this.drawProfile(width, height, fontSize);
    }
    if (this.view === "initial-interview")
      this.drawInterview(width, height, fontSize, "initial");
    if (this.view === "post-med-interview")
      this.drawInterview(width, height, fontSize, "post-medication");
    if (this.view === "procedure") this.drawProcedure(width, height, fontSize);
    if (!this.settingsOpen) {
      const setting = this.add.image(
        width - Math.max(48, width * 0.036),
        Math.max(44, height * 0.05),
        "patientInteractionSettings",
      );
      const settingSource = this.textures
        .get("patientInteractionSettings")
        .getSourceImage() as HTMLImageElement;
      setting
        .setScale(Math.max(84, width * 0.072) / settingSource.width)
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
        folderTextureKey: "patientInteractionSettingsFolder",
        exitLabel: "ออกจากเกม",
        onClose: () => {
          this.click();
          this.settingsOpen = false;
          this.draw();
        },
        onExit: () => {
          this.click();
          sessionStorage.removeItem("medclue-game-scene");
          this.scene.stop("GameRoom");
          this.scene.start("CaseBrief");
        },
      });
    }
  };

  private addBack(
    label: string,
    target: PatientView | "room",
    width: number,
    height: number,
  ) {
    const back = this.add
      .text(
        Math.max(24, width * 0.025),
        Math.max(30, height * 0.045),
        `< ${label}`,
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
      .setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => {
      this.click();
      if (target === "room") {
        this.scene.stop();
        this.scene.resume("GameRoom");
      } else {
        this.view = target;
        this.draw();
      }
    });
  }

  private drawProfile(
    width: number,
    height: number,
    fontSize: (size: number) => string,
  ) {
    const scale = Math.min(width / 1280, height / 720);
    const tagX = width * PATIENT_TAG_LAYOUT.x;
    const tagY = height * PATIENT_TAG_LAYOUT.y;
    const tagWidth = Math.min(width * 0.42, PATIENT_TAG_LAYOUT.width * scale);
    const tagImage = this.add.image(tagX, tagY, "patientNameTag");
    tagImage.setScale(tagWidth / tagImage.width).setDepth(4);
    const textX = tagX + tagWidth * PATIENT_TAG_LAYOUT.textOffsetX;
    const textY = tagY + tagWidth * PATIENT_TAG_LAYOUT.textOffsetY;
    const lineGap = tagWidth * 0.105;
    this.add
      .text(textX, textY - lineGap, "ผู้ป่วยเตียง 11", {
        fontFamily: this.uiFont,
        fontSize: fontSize(25),
        fontStyle: "bold",
        color: "#25221d",
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(textX, textY, "นายธนกฤต วัฒนากุล", {
        fontFamily: this.uiFont,
        fontSize: fontSize(20),
        color: "#28251f",
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(textX, textY + lineGap, "HN  69031427", {
        fontFamily: this.uiFont,
        fontSize: fontSize(18),
        color: "#28251f",
      })
      .setOrigin(0.5)
      .setDepth(6);

    const buttonY = height * 0.73;
    this.button(
      width / 2,
      buttonY,
      width * 0.24,
      height * 0.09,
      "สนทนา",
      true,
      fontSize(22),
      () => {
        this.view = this.registry.get("patientMedicationAdministered")
          ? "post-med-interview"
          : "initial-interview";
        this.selectedAnswers = [];
        this.initialQuestionIndex = 0;
        this.answerText = "เลือกคำถามเพื่อสนทนากับผู้ป่วย";
        this.draw();
      },
    );
    this.button(
      width / 2,
      buttonY + height * 0.105,
      width * 0.24,
      height * 0.09,
      "หัตถการ",
      false,
      fontSize(22),
      () => {
        this.view = "procedure";
        this.draw();
      },
    );
  }

  private drawInterview(
    width: number,
    height: number,
    fontSize: (size: number) => string,
    stage: "initial" | "post-medication",
  ) {
    const isInitial = stage === "initial";
    this.drawConversation(
      width,
      height,
      fontSize,
      isInitial ? interviewQuestions : postMedicationQuestions,
      isInitial ? "สนทนารอบแรก" : "สนทนาหลังฉีดยา",
      stage,
    );
  }

  private drawConversation(
    width: number,
    height: number,
    fontSize: (size: number) => string,
    questions: typeof interviewQuestions | typeof postMedicationQuestions,
    title: string,
    stage: "initial" | "post-medication",
  ) {
    this.addBack(title, "profile", width, height);
    const scale = Math.min(width / 1280, height / 720);
    const question = questions[this.initialQuestionIndex];
    const titleY = height * 0.105;
    this.add
      .text(width / 2, titleY, title, {
        fontFamily: this.uiFont,
        fontSize: fontSize(25),
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#171411",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(6);
    const progressY = height * 0.16;
    const progressW = Math.min(width * 0.28, 360);
    this.add
      .rectangle(width / 2, progressY, progressW, 7 * scale, 0xffffff, 0.38)
      .setDepth(5);
    this.add
      .rectangle(
        width / 2 -
          (progressW *
            (1 - (this.initialQuestionIndex + 1) / questions.length)) /
            2,
        progressY,
        (progressW * (this.initialQuestionIndex + 1)) / questions.length,
        7 * scale,
        0xf0c65b,
      )
      .setDepth(6);
    this.add
      .text(
        width / 2,
        progressY + 18 * scale,
        `คำถาม ${this.initialQuestionIndex + 1} / ${questions.length}`,
        {
          fontFamily: this.uiFont,
          fontSize: fontSize(13),
          color: "#ffffff",
          stroke: "#171411",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5)
      .setDepth(6);

    const nurseBubbleY = height * 0.35;
    const patientBubbleY = height * 0.51;
    const nurseBubbleX = width * 0.28;
    const patientBubbleX = width * 0.72;
    const bubbleW = Math.min(width * 0.39, 560);
    const nurseBubbleH = Math.min(height * 0.17, 150);
    const patientBubbleH = Math.min(height * 0.12, 112);
    this.drawSpeakerTag(
      nurseBubbleX,
      nurseBubbleY - nurseBubbleH * 0.5 - 20 * scale,
      "พยาบาลถาม",
      0x743d31,
      fontSize(14),
    );
    this.drawSpeakerTag(
      patientBubbleX,
      patientBubbleY - patientBubbleH * 0.5 - 20 * scale,
      "ผู้ป่วยตอบ",
      0x285a7a,
      fontSize(14),
    );
    this.drawSpeechBubble(
      nurseBubbleX,
      nurseBubbleY,
      bubbleW,
      nurseBubbleH,
      0xffe9c9,
      0x743d31,
      false,
    );
    this.add
      .text(
        nurseBubbleX,
        nurseBubbleY,
        question.options.find(
          (option) =>
            option.text === this.selectedAnswers[this.initialQuestionIndex],
        )?.text ?? question.prompt,
        {
          fontFamily: this.uiFont,
          fontSize: fontSize(18),
          color: "#29251f",
          align: "center",
          wordWrap: { width: bubbleW - 42 },
        },
      )
      .setOrigin(0.5)
      .setDepth(9);
    this.drawSpeechBubble(
      patientBubbleX,
      patientBubbleY,
      bubbleW,
      patientBubbleH,
      0xdcecf8,
      0x285a7a,
      true,
    );
    const selectedOption = question.options.find(
      (option) =>
        option.text === this.selectedAnswers[this.initialQuestionIndex],
    );
    const patientReply =
      selectedOption?.response ??
      (this.answerText.startsWith("ผู้ป่วย: กรุณา") ||
      this.answerText.startsWith("ผู้ป่วย: เลือก")
        ? this.answerText.replace("ผู้ป่วย: ", "")
        : "รอฟังคำถามจากพยาบาล...");
    this.add
      .text(patientBubbleX, patientBubbleY, patientReply, {
        fontFamily: this.uiFont,
        fontSize: fontSize(16),
        color: "#29251f",
        align: "center",
        wordWrap: { width: bubbleW - 42 },
      })
      .setOrigin(0.5)
      .setDepth(9);

    this.add
      .text(width / 2, height * 0.615, "เลือกคำถามที่จะถามผู้ป่วย", {
        fontFamily: this.uiFont,
        fontSize: fontSize(15),
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#171411",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(7);
    const buttonW = Math.min(width * 0.64, 820);
    const buttonH = Math.min(48 * scale, height * 0.066);
    const firstOptionY = height * 0.68;
    const optionGap = height * 0.071;
    question.options.forEach((option, optionIndex) => {
      const optionY = firstOptionY + optionIndex * optionGap;
      const selected =
        this.selectedAnswers[this.initialQuestionIndex] === option.text;
      const shadow = this.add
        .rectangle(width / 2, optionY + 3, buttonW, buttonH, 0x000000, 0.38)
        .setDepth(5);
      const face = this.add
        .rectangle(
          width / 2,
          optionY,
          buttonW,
          buttonH,
          selected ? 0x338a58 : 0xfffaf0,
          0.98,
        )
        .setStrokeStyle(selected ? 3 : 1.5, selected ? 0x174d2d : 0x29251f)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(
          width / 2,
          optionY,
          selected ? `✓  ${option.text}` : option.text,
          {
            fontFamily: this.uiFont,
            fontSize: fontSize(16),
            fontStyle: selected ? "bold" : "normal",
            color: selected ? "#ffffff" : "#29251f",
            align: "center",
            wordWrap: { width: buttonW - 28 },
          },
        )
        .setOrigin(0.5)
        .setDepth(7);
      face.on("pointerover", () => {
        face.setFillStyle(selected ? 0x277647 : 0xf4ead8);
        this.tweens.add({
          targets: [face, label],
          y: optionY - 2,
          duration: 110,
          ease: "Sine.Out",
        });
        this.tweens.add({
          targets: shadow,
          y: optionY + 1,
          duration: 110,
          ease: "Sine.Out",
        });
      });
      face.on("pointerout", () => {
        face.setFillStyle(selected ? 0x338a58 : 0xfffaf0);
        this.tweens.add({
          targets: [face, label],
          y: optionY,
          duration: 110,
          ease: "Sine.Out",
        });
        this.tweens.add({
          targets: shadow,
          y: optionY + 3,
          duration: 110,
          ease: "Sine.Out",
        });
      });
      const choose = () => {
        this.click();
        this.selectedAnswers[this.initialQuestionIndex] = option.text;
        this.answerText = `ผู้ป่วย: ${option.response}`;
        this.draw();
      };
      face.on("pointerdown", choose);
      label.setInteractive({ useHandCursor: true }).on("pointerdown", choose);
    });

    if (this.initialQuestionIndex > 0) {
      this.button(
        width * 0.39,
        height * 0.94,
        width * 0.18,
        height * 0.065,
        "‹ ก่อนหน้า",
        false,
        fontSize(16),
        () => {
          this.initialQuestionIndex -= 1;
          const previousQuestion = questions[this.initialQuestionIndex];
          const previousAnswer = previousQuestion.options.find(
            (option) =>
              option.text === this.selectedAnswers[this.initialQuestionIndex],
          );
          this.answerText = previousAnswer
            ? `ผู้ป่วย: ${previousAnswer.response}`
            : "เลือกคำถามเพื่อสนทนากับผู้ป่วย";
          this.draw();
        },
      );
    }
    if (this.initialQuestionIndex < questions.length - 1) {
      this.button(
        width * 0.61,
        height * 0.94,
        width * 0.18,
        height * 0.065,
        "ถัดไป ›",
        true,
        fontSize(16),
        () => {
          if (!this.selectedAnswers[this.initialQuestionIndex]) {
            this.answerText = "ผู้ป่วย: เลือกคำถามก่อนนะครับ";
            this.draw();
            return;
          }
          this.initialQuestionIndex += 1;
          const nextQuestion = questions[this.initialQuestionIndex];
          const nextAnswer = nextQuestion.options.find(
            (option) =>
              option.text === this.selectedAnswers[this.initialQuestionIndex],
          );
          this.answerText = nextAnswer
            ? `ผู้ป่วย: ${nextAnswer.response}`
            : "เลือกคำถามเพื่อสนทนากับผู้ป่วย";
          this.draw();
        },
      );
    }

    if (
      this.initialQuestionIndex === questions.length - 1 &&
      this.selectedAnswers[this.initialQuestionIndex]
    ) {
      this.button(
        width * 0.61,
        height * 0.94,
        width * 0.18,
        height * 0.065,
        "ยืนยัน",
        true,
        fontSize(16),
        () => this.confirmInterview(stage, questions),
      );
    }
  }

  private drawSpeechBubble(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: number,
    border: number,
    tailRight: boolean,
  ) {
    const graphics = this.add.graphics().setDepth(7);
    graphics.fillStyle(fill, 1);
    graphics.lineStyle(2, border, 1);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 18);
    graphics.strokeRoundedRect(
      x - width / 2,
      y - height / 2,
      width,
      height,
      18,
    );
    const tailX = tailRight ? x + width * 0.34 : x - width * 0.34;
    const dir = tailRight ? 1 : -1;
    graphics.fillTriangle(
      tailX,
      y + height / 2 - 4,
      tailX + dir * 20,
      y + height / 2 + 18,
      tailX + dir * 35,
      y + height / 2 - 4,
    );
    graphics.lineBetween(
      tailX,
      y + height / 2 - 3,
      tailX + dir * 20,
      y + height / 2 + 18,
    );
    graphics.lineBetween(
      tailX + dir * 20,
      y + height / 2 + 18,
      tailX + dir * 35,
      y + height / 2 - 3,
    );
  }

  private drawSpeakerTag(
    x: number,
    y: number,
    label: string,
    color: number,
    fontSize: string,
  ) {
    this.add
      .rectangle(x, y, 150, 30, color)
      .setStrokeStyle(1.5, 0xffffff)
      .setDepth(8);
    this.add
      .text(x, y, label, {
        fontFamily: this.uiFont,
        fontSize,
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private confirmInterview(
    stage: "initial" | "post-medication",
    questions: typeof interviewQuestions | typeof postMedicationQuestions,
  ) {
    if (this.selectedAnswers.filter(Boolean).length !== questions.length) {
      const nextUnanswered = this.selectedAnswers.findIndex(
        (answer) => !answer,
      );
      this.initialQuestionIndex = nextUnanswered >= 0 ? nextUnanswered : 0;
      this.answerText =
        "ผู้ป่วย: กรุณาเลือกคำถามอย่างน้อยหนึ่งข้อในแต่ละหมวดก่อนยืนยัน";
      this.draw();
      return;
    }
    const answers = this.selectedAnswers.map((selected, index) => {
      const question = questions[index];
      const chosen = question.options.find(
        (option) => option.text === selected,
      );
      return {
        question: question.prompt,
        selectedQuestion: selected,
        patientResponse: chosen?.response ?? "",
        score: chosen?.score ?? 0,
        maxScore: 25,
      };
    });
    const previousRounds = this.registry.get("patientConversationRounds") ?? {};
    const score = answers.reduce((total, answer) => total + answer.score, 0);
    this.registry.set(
      "patientConversationRounds",
      stage === "initial"
        ? {
            ...previousRounds,
            initialInterviewCompleted: true,
            initialInterviewScore: score,
            initialInterviewMaxScore: answers.length * 25,
            initialInterviewAnswers: answers,
          }
        : {
            ...previousRounds,
            postMedicationCompleted: true,
            postMedicationScore: score,
            postMedicationMaxScore: answers.length * 25,
            postMedicationAnswers: answers,
          },
    );
    if (stage === "initial") {
      this.view = "profile";
      this.draw();
    } else {
      this.scene.stop();
      this.scene.resume("GameRoom");
    }
  }

  private drawProcedure(
    width: number,
    height: number,
    fontSize: (size: number) => string,
  ) {
    this.addBack("หัตถการ", "profile", width, height);
    const scale = Math.min(width / 1280, height / 720);
    const cx = width / 2;
    this.button(
      cx,
      height * 0.38,
      Math.min(width * 0.27, 360),
      height * 0.1,
      "ตรวจสอบสภาพผิว",
      true,
      fontSize(20),
      () => {
        this.registry.set("patientProcedure", "skin-check");
        this.scene.stop();
        this.scene.launch("SkinAssessment");
      },
    );
    this.button(
      cx,
      height * 0.51,
      Math.min(width * 0.27, 360),
      height * 0.1,
      "ให้ยา",
      false,
      fontSize(20),
      () => {
        this.registry.set("patientProcedure", "medication");
        const preparation = this.registry.get("medicationPreparation");
        this.scene.stop();
        if (preparation?.medicineSelected) {
          this.scene.launch("MedicationPatientFlow");
        } else {
          this.scene.resume("GameRoom");
          this.scene.launch("MedicationTray", {
            origin: { x: cx, y: height * 0.51, width: 0, height: 0 },
          });
        }
      },
    );
    this.add
      .text(width - 24 * scale, height - 24 * scale, "เลือกขั้นตอนหัตถการ", {
        fontFamily: this.uiFont,
        fontSize: fontSize(14),
        color: "#ffffff",
      })
      .setOrigin(1)
      .setDepth(4);
  }

  private button(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    primary: boolean,
    textSize: string,
    onClick: () => void,
  ) {
    const shadow = this.add
      .rectangle(x, y + 3, w, h, primary ? 0x3f2523 : 0x544f47)
      .setDepth(7);
    const box = this.add
      .rectangle(x, y, w, h, primary ? 0x754444 : 0xfaf7ef)
      .setStrokeStyle(1.5, primary ? 0x3f2523 : 0x29251f)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: this.uiFont,
        fontSize: textSize,
        fontStyle: "bold",
        color: primary ? "#ffffff" : "#28231f",
      })
      .setOrigin(0.5)
      .setDepth(9);
    box.on("pointerover", () => {
      box.setFillStyle(primary ? 0x875252 : 0xeee5d6);
      this.tweens.add({
        targets: [box, text],
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
    box.on("pointerout", () => {
      box.setFillStyle(primary ? 0x754444 : 0xfaf7ef);
      this.tweens.add({
        targets: [box, text],
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
    box.on("pointerdown", () => {
      this.click();
      onClick();
    });
    text
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => box.emit("pointerdown"));
  }

  private click() {
    if (this.cache.audio.exists("patientInteractionClick")) {
      this.sound.play("patientInteractionClick", { volume: 0.7 });
    }
  }
}
