import Phaser from "phaser";

import { drawSettingsPanel } from "./SettingsPanel";

const roomObjects = [
  {
    id: "med-cart",
    image: "medCart",
    hover: "medCartHover",
    x: 0.158,
    y: 0.65,
    height: 0.46,
    hoverHeight: 0.46,
    depth: 2,
  },
  {
    id: "doctor-desk",
    image: "doctorDesk",
    hover: "doctorDeskHover",
    x: 0.314,
    y: 0.65,
    height: 0.35,
    hoverHeight: 0.35,
    depth: 2,
  },
  {
    id: "patient-bed",
    image: "patientBed",
    hover: "patientBedHover",
    x: 0.601,
    y: 0.639,
    height: 0.656,
    hoverHeight: 0.656,
    depth: 3,
  },
  {
    id: "monitor",
    image: "vitalMonitor",
    hover: "vitalMonitorHover",
    x: 0.837,
    y: 0.598,
    height: 0.501,
    hoverHeight: 0.501,
    depth: 4,
  },
] as const;

const ROOM_LAYOUT_WIDTH = 1728;
const ROOM_LAYOUT_HEIGHT = 1152;
const exitReasons = [
  "ชื่อผู้ป่วยไม่ตรง",
  "ยาต้องให้หลังอาหาร แต่ผู้ป่วยยังไม่ได้รับประทาน",
  "ค่า BP ผิดปกติ",
  "ค่า BT ผิดปกติ",
  "ค่า SpO₂ ผิดปกติ",
  "ค่า HR ผิดปกติ",
  "ค่า RR ผิดปกติ",
  "ค่าอื่นในมอนิเตอร์ผิดปกติ",
  "ผู้ป่วยยังไม่ต้องการรับยาในตอนนี้",
  "ไม่มียาที่ต้องการในตู้ยา",
  "ไม่มีไซริงที่ต้องการ",
];

export class GameRoomScene extends Phaser.Scene {
  private settingsOpen = false;
  private exitReasonsOpen = false;
  private selectedExitReasons = new Set<string>();

  constructor() {
    super("GameRoom");
  }

  preload() {
    this.load.image("hospitalRoom", "/images/game/bg_new.png");
    this.load.image("roomSettingsFolder", "/images/game/floder_brown.png");
    this.load.image("medCart", "/images/game/car.png");
    this.load.image("medCartHover", "/images/game/car_hover.png");
    this.load.image("doctorDesk", "/images/game/deskdoctor.png");
    this.load.image("doctorDeskHover", "/images/game/desk_hover.png");
    this.load.image("patientBed", "/images/game/patient.png");
    this.load.image("patientBedHover", "/images/game/bed_hover.png");
    this.load.image("vitalMonitor", "/images/game/monitor.png");
    this.load.image("vitalMonitorHover", "/images/game/monitor_hover.png");
    this.load.image("settings", "/images/game/setting_icon.png");
    this.load.image("exitDoor", "/images/game/door.png");
    this.load.audio("iconClick", "/sounds/iconclick.wav");
  }

  create() {
    this.registry.set("patientMedicationAdministered", false);
    this.registry.set("medicationAdministrationDraft", null);
    this.registry.set("medicationAdministrationRecord", null);
    this.registry.set("patientConversationRounds", {});
    this.registry.set("patientSkinAssessment", {
      completed: false,
      checkedAreas: [],
    });
    this.registry.set("medicationPreparation", {
      medicineSelected: false,
      syringeSelected: null,
      glucose: 214,
      calculatedDose: null,
      doseCalculated: false,
      aspirated: false,
      aspirationStep: 0,
    });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.draw, this);
    this.draw();
  }

  private draw() {
    this.children.removeAll(true);
    const { width, height } = this.scale;
    // Keep room props tied to a single design scale. Height-only sizing made
    // them stay too large when the game viewport became narrow.
    const roomScale = Math.min(
      width / ROOM_LAYOUT_WIDTH,
      height / ROOM_LAYOUT_HEIGHT,
    );
    const background = this.add.image(width / 2, height / 2, "hospitalRoom");
    const source = this.textures
      .get("hospitalRoom")
      .getSourceImage() as HTMLImageElement;
    background
      .setScale(Math.max(width / source.width, height / source.height))
      .setDepth(0);

    roomObjects.forEach((item) => {
      const sprite = this.add.image(
        width * item.x,
        height * item.y,
        item.image,
      );
      const normalDisplayHeight = ROOM_LAYOUT_HEIGHT * roomScale * item.height;
      const hoverDisplayHeight =
        ROOM_LAYOUT_HEIGHT * roomScale * item.hoverHeight;
      sprite
        .setScale(normalDisplayHeight / sprite.height)
        .setDepth(item.depth)
        .setInteractive({ useHandCursor: true });
      sprite.on("pointerover", () => {
        sprite.setTexture(item.hover);
        sprite.setScale(hoverDisplayHeight / sprite.height);
      });
      sprite.on("pointerout", () => {
        sprite.setTexture(item.image);
        sprite.setScale(normalDisplayHeight / sprite.height);
      });
      sprite.on("pointerdown", () => {
        this.game.events.emit("room-object-selected", item.id);
        const origin = {
          x: sprite.x,
          y: sprite.y,
          width: sprite.width * sprite.scaleX,
          height: sprite.height * sprite.scaleY,
        };
        if (item.id === "med-cart") {
          this.scene.pause();
          this.scene.launch("MedicationTray", { origin });
        } else if (item.id === "patient-bed") {
          this.scene.pause();
          this.scene.launch("PatientInteraction", { view: "profile" });
        } else if (item.id === "monitor" || item.id === "doctor-desk") {
          this.scene.pause();
          this.scene.launch("ObjectInspect", { objectId: item.id, origin });
        }
      });
    });

    const iconSize = Math.max(84, width * 0.072);
    const settingsX = width - Math.max(48, width * 0.036);
    const iconY = Math.max(44, height * 0.05);
    const doorIconSize = Math.max(60, width * 0.04);
    this.add
      .image(settingsX, iconY, "settings")
      .setScale(iconSize / this.textures.get("settings").getSourceImage().width)
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("iconClick", { volume: 1 });
        this.settingsOpen = !this.settingsOpen;
        this.draw();
      });

    const doorSource = this.textures.get("exitDoor").getSourceImage();
    const door = this.add
      .image(settingsX - iconSize * 0.92, iconY, "exitDoor")
      .setScale(doorIconSize / Math.max(doorSource.width, doorSource.height))
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    door.on("pointerdown", () => {
      this.sound.play("iconClick", { volume: 1 });
      this.exitReasonsOpen = !this.exitReasonsOpen;
      this.draw();
    });

    if (this.settingsOpen) {
      drawSettingsPanel(this, {
        folderTextureKey: "roomSettingsFolder",
        exitLabel: "ออกจากเกม",
        onClose: () => {
          this.settingsOpen = false;
          this.draw();
        },
        onExit: () => {
          this.sound.play("iconClick", { volume: 1 });
          sessionStorage.removeItem("medclue-game-scene");
          this.settingsOpen = false;
          this.scene.start("CaseBrief");
        },
      });
    }
    if (this.exitReasonsOpen) this.drawExitReasonsPanel(width, height);
  }

  private drawExitReasonsPanel(width: number, height: number) {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    const fontFamily = `${promptFont || "Arial"}, Arial, sans-serif`;
    const panelWidth = Math.min(width * 0.78, 820);
    const panelHeight = Math.min(height * 0.9, 850);
    const centerX = width / 2;
    const centerY = height / 2;
    const panelLeft = centerX - panelWidth / 2;
    const panelTop = centerY - panelHeight / 2;
    const uiScale = Math.min(height / 720, Math.max(0.8, width / 900));
    const fontSize = (size: number) => `${Math.max(14, size * uiScale)}px`;

    this.add
      .rectangle(centerX, centerY, width, height, 0x08100f, 0.76)
      .setDepth(30)
      .setInteractive();
    const panel = this.add.graphics().setDepth(31);
    panel.fillStyle(0x100d0b, 0.3);
    panel.fillRoundedRect(
      panelLeft + 7,
      panelTop + 9,
      panelWidth,
      panelHeight,
      22,
    );
    // Warm folder backing gives the sheet a little depth without moving its contents.
    panel.fillStyle(0x72513a, 1);
    panel.fillRoundedRect(
      panelLeft - 10,
      panelTop - 10,
      panelWidth + 20,
      panelHeight + 20,
      26,
    );
    panel.lineStyle(2, 0x9a7652, 0.9);
    panel.strokeRoundedRect(
      panelLeft - 7,
      panelTop - 7,
      panelWidth + 14,
      panelHeight + 14,
      23,
    );
    panel.fillStyle(0xf2e6ce, 1);
    panel.lineStyle(3, 0x49392c, 1);
    panel.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 22);
    panel.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 22);
    panel.lineStyle(1, 0xb79a6f, 0.75);
    panel.strokeRoundedRect(
      panelLeft + 9,
      panelTop + 9,
      panelWidth - 18,
      panelHeight - 18,
      16,
    );
    const spineWidth = Math.max(34, panelWidth * 0.055);
    panel.fillStyle(0xe4d2b3, 1);
    panel.fillRoundedRect(
      panelLeft + 7,
      panelTop + 9,
      spineWidth,
      panelHeight - 18,
      12,
    );
    panel.lineStyle(1, 0xc2a27a, 0.8);
    panel.lineBetween(
      panelLeft + 12,
      panelTop + 18,
      panelLeft + spineWidth + 2,
      panelTop + 18,
    );
    panel.lineBetween(
      panelLeft + 12,
      panelTop + panelHeight - 18,
      panelLeft + spineWidth + 2,
      panelTop + panelHeight - 18,
    );
    panel.lineStyle(1, 0xb79a6f, 0.8);
    panel.lineBetween(
      panelLeft + spineWidth + 7,
      panelTop + 15,
      panelLeft + spineWidth + 7,
      panelTop + panelHeight - 15,
    );
    const binderHoleX = panelLeft + spineWidth / 2 + 3;
    [0.27, 0.43, 0.59, 0.75].forEach((position) => {
      const binderHoleY = panelTop + panelHeight * position;
      panel.fillStyle(0x9f8060, 0.8);
      panel.fillCircle(binderHoleX, binderHoleY, 7);
      panel.fillStyle(0xf7efdf, 1);
      panel.fillCircle(binderHoleX, binderHoleY, 4);
    });
    // Small brass corner studs and stitched marks make the brown frame read as a folder.
    [panelLeft - 4, panelLeft + panelWidth + 4].forEach((x) => {
      [panelTop - 4, panelTop + panelHeight + 4].forEach((y) => {
        panel.fillStyle(0xc49a5b, 1);
        panel.fillCircle(x, y, 3.5);
        panel.fillStyle(0x6b482f, 1);
        panel.fillCircle(x, y, 1.3);
      });
    });
    panel.lineStyle(1, 0xc49a5b, 0.8);
    for (let stitchX = panelLeft + 30; stitchX < panelLeft + panelWidth - 24; stitchX += 18) {
      panel.lineBetween(stitchX, panelTop - 5, stitchX + 7, panelTop - 5);
      panel.lineBetween(stitchX, panelTop + panelHeight + 5, stitchX + 7, panelTop + panelHeight + 5);
    }
    panel.fillStyle(0x754444, 1);
    panel.fillRoundedRect(
      panelLeft + 12,
      panelTop + 12,
      panelWidth - 24,
      panelHeight * 0.13,
      16,
    );
    const headerLeft = panelLeft + 12;
    const headerTop = panelTop + 12;
    const headerWidth = panelWidth - 24;
    const headerHeight = panelHeight * 0.13;
    panel.lineStyle(1.5, 0xd6b77e, 0.9);
    panel.strokeRoundedRect(
      headerLeft + 5,
      headerTop + 5,
      headerWidth - 10,
      headerHeight - 10,
      11,
    );
    const ornamentY = headerTop + headerHeight / 2;
    const ornamentInset = Math.max(30, headerWidth * 0.055);
    [headerLeft + ornamentInset, headerLeft + headerWidth - ornamentInset].forEach(
      (ornamentX) => {
        panel.fillStyle(0xe0c18a, 1);
        panel.fillCircle(ornamentX, ornamentY, 4);
        panel.fillStyle(0x754444, 1);
        panel.fillCircle(ornamentX, ornamentY, 1.6);
      },
    );
    panel.lineStyle(1, 0xd6b77e, 0.8);
    panel.lineBetween(
      headerLeft + 17,
      ornamentY,
      headerLeft + ornamentInset - 9,
      ornamentY,
    );
    panel.lineBetween(
      headerLeft + headerWidth - ornamentInset + 9,
      ornamentY,
      headerLeft + headerWidth - 17,
      ornamentY,
    );

    this.add
      .text(centerX, panelTop + panelHeight * 0.09, "หยุดก่อนให้ยา", {
        fontFamily,
        fontSize: fontSize(30),
        fontStyle: "bold",
        color: "#fffaf0",
      })
      .setOrigin(0.5)
      .setDepth(32);
    this.add
      .text(
        centerX,
        panelTop + panelHeight * 0.16,
        "เลือกเหตุผลได้มากกว่าหนึ่งข้อ",
        {
          fontFamily,
          fontSize: fontSize(16),
          color: "#67584b",
        },
      )
      .setOrigin(0.5)
      .setDepth(32);

    const columns = width < 360 ? 1 : 2;
    const rows = Math.ceil(exitReasons.length / columns);
    const contentTop = panelTop + panelHeight * 0.2;
    const footerTop = panelTop + panelHeight * 0.91;
    const gap = Math.max(8, panelWidth * 0.018);
    const sidePadding = panelWidth * 0.07;
    const cardWidth =
      (panelWidth - sidePadding * 2 - gap * (columns - 1)) / columns;
    const rowGap = Math.max(7, panelHeight * 0.012);
    const cardHeight = Math.min(
      62 * uiScale,
      (footerTop - contentTop - rowGap * (rows - 1)) / rows,
    );

    this.add
      .text(
        panelLeft + sidePadding,
        panelTop + panelHeight * 0.96,
        `เลือกแล้ว ${this.selectedExitReasons.size} ข้อ`,
        {
          fontFamily,
          fontSize: fontSize(15),
          fontStyle: "bold",
          color: "#67584b",
        },
      )
      .setOrigin(0, 0.5)
      .setDepth(34);

    exitReasons.forEach((reason, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x =
        panelLeft + sidePadding + cardWidth / 2 + column * (cardWidth + gap);
      const y = contentTop + cardHeight / 2 + row * (cardHeight + rowGap);
      const selected = this.selectedExitReasons.has(reason);
      const cardLeft = x - cardWidth / 2;
      const cardTop = y - cardHeight / 2;
      const cardVisual = this.add.graphics().setDepth(32);
      cardVisual.fillStyle(selected ? 0x245d3d : 0x100d0b, selected ? 1 : 0.12);
      cardVisual.fillRoundedRect(
        cardLeft + 2,
        cardTop + 3,
        cardWidth,
        cardHeight,
        12,
      );
      cardVisual.fillStyle(selected ? 0x338a58 : 0xfffcf5, 1);
      cardVisual.lineStyle(2, selected ? 0x174d2d : 0xc4ad86, 1);
      cardVisual.fillRoundedRect(cardLeft, cardTop, cardWidth, cardHeight, 12);
      cardVisual.strokeRoundedRect(
        cardLeft,
        cardTop,
        cardWidth,
        cardHeight,
        12,
      );
      const checkX = cardLeft + Math.max(24, cardWidth * 0.09);
      this.add
        .circle(
          checkX,
          y,
          Math.max(9, Math.min(13, cardHeight * 0.22)),
          selected ? 0x245d3d : 0xf5ecdc,
        )
        .setStrokeStyle(2, selected ? 0xffffff : 0xa28d70)
        .setDepth(33);
      if (selected) {
        this.add
          .text(checkX, y, "✓", {
            fontFamily,
            fontSize: fontSize(13),
            fontStyle: "bold",
            color: "#ffffff",
          })
          .setOrigin(0.5)
          .setDepth(34);
      }
      this.add
        .text(checkX + Math.max(13, cardWidth * 0.055), y, reason, {
          fontFamily,
          fontSize: fontSize(15),
          fontStyle: selected ? "bold" : "normal",
          color: selected ? "#ffffff" : "#302820",
          align: "left",
          wordWrap: { width: cardWidth - Math.max(54, cardWidth * 0.18) },
        })
        .setOrigin(0, 0.5)
        .setDepth(34);
      const card = this.add
        .rectangle(x, y, cardWidth, cardHeight, 0xffffff, 0)
        .setDepth(35)
        .setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => {
        if (selected) this.selectedExitReasons.delete(reason);
        else this.selectedExitReasons.add(reason);
        this.sound.play("iconClick", { volume: 0.65 });
        this.draw();
      });
    });

    const closeRadius = Math.max(18, 22 * uiScale);
    const panelRight = panelLeft + panelWidth;
    const closeCanSitOutside = width - panelRight >= closeRadius * 2 + 36;
    const closeX = closeCanSitOutside
      ? panelRight + closeRadius + 12
      : panelRight - sidePadding * 0.7;
    const closeY = panelTop + panelHeight * 0.065;
    this.add
      .circle(closeX, closeY, Math.max(18, 22 * uiScale), 0x754444)
      .setStrokeStyle(2, 0xfff7e8)
      .setDepth(33)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.exitReasonsOpen = false;
        this.draw();
      });
    this.add
      .text(closeX, closeY - 1, "×", {
        fontFamily: "Arial, sans-serif",
        fontSize: fontSize(29),
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(34);

    const buttonWidth = Math.min(panelWidth * 0.25, 210);
    const buttonHeight = Math.max(42, Math.min(62, height * 0.07));
    const rightSideSpace = width - panelRight;
    const buttonCanSitOutside = rightSideSpace >= buttonWidth + 26;
    const buttonX = buttonCanSitOutside
      ? width - buttonWidth / 2 - 16
      : panelRight - sidePadding - buttonWidth / 2;
    const buttonY = panelTop + panelHeight * 0.96;
    const buttonShadow = this.add
      .rectangle(
        buttonX,
        buttonY + 3,
        buttonWidth,
        buttonHeight,
        0x3f2523,
      )
      .setDepth(32);
    const button = this.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x754444)
      .setStrokeStyle(1.5, 0x3f2523)
      .setDepth(33)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.registry.set("medicationExitReasons", [
          ...this.selectedExitReasons,
        ]);
        sessionStorage.removeItem("medclue-game-scene");
        this.scene.start("CaseBrief");
      });
    const buttonText = width < 700 ? "บันทึกและออก" : "บันทึกเหตุผลและออก";
    const buttonLabel = this.add
      .text(
        buttonX,
        buttonY,
        buttonText,
        {
          fontFamily,
          fontSize: fontSize(16),
          fontStyle: "bold",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5)
      .setDepth(34);
    button.on("pointerover", () => {
      button.setFillStyle(0x875252);
      this.tweens.add({
        targets: [button, buttonLabel],
        y: buttonY - 2,
        duration: 120,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: buttonShadow,
        y: buttonY + 1,
        duration: 120,
        ease: "Sine.Out",
      });
    });
    button.on("pointerout", () => {
      button.setFillStyle(0x754444);
      this.tweens.add({
        targets: [button, buttonLabel],
        y: buttonY,
        duration: 120,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: buttonShadow,
        y: buttonY + 3,
        duration: 120,
        ease: "Sine.Out",
      });
    });
  }

  private drawSettings(width: number, height: number) {
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.48)
      .setDepth(30);
    this.add
      .rectangle(
        width / 2,
        height / 2,
        Math.min(500, width * 0.8),
        270,
        0xf4ead7,
      )
      .setStrokeStyle(3, 0x34231b)
      .setDepth(31);
    this.add
      .text(width / 2, height / 2 - 35, "ตั้งค่าฉาก", {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#261d18",
      })
      .setOrigin(0.5)
      .setDepth(32);
    this.add
      .text(width / 2, height / 2 + 15, "ปิด", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#754444",
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(32)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.settingsOpen = false;
        this.draw();
      });
    this.add
      .text(width / 2, height / 2 + 78, "ออกจากเกม", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#754444",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(32)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("iconClick", { volume: 1 });
        sessionStorage.removeItem("medclue-game-scene");
        this.settingsOpen = false;
        this.scene.start("CaseBrief");
      });
  }
}
