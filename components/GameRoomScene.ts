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

export class GameRoomScene extends Phaser.Scene {
  private settingsOpen = false;

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
    this.load.audio("iconClick", "/sounds/iconclick.wav");
  }

  create() {
    this.registry.set("patientMedicationAdministered", false);
    this.registry.set("patientConversationRounds", {});
    this.registry.set("patientSkinAssessment", { completed: false, checkedAreas: [] });
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
      const hoverDisplayHeight = ROOM_LAYOUT_HEIGHT * roomScale * item.hoverHeight;
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

    this.add
      .image(
        width - Math.max(38, 62 * roomScale),
        Math.max(34, 58 * roomScale),
        "settings",
      )
      .setScale(
        Math.max(56, 124 * roomScale) /
          this.textures.get("settings").getSourceImage().width,
      )
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("iconClick", { volume: 1 });
        this.settingsOpen = !this.settingsOpen;
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
