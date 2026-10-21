import Phaser from "phaser";

type SceneOrigin = { x: number; y: number; width: number; height: number };

const trayItems = [
  {
    id: "insulin-syringe",
    normal: "trayF1",
    hover: "trayF1Hover",
    x: 0.235,
    y: 0.155,
    height: 0.458,
    hoverHeight: 0.458,
  },
  {
    id: "syringe-set",
    normal: "trayKemAll",
    hover: "trayKemAllHover",
    x: 0.255,
    y: -0.307,
    height: 0.4,
    hoverHeight: 0.4,
  },
  {
    id: "dose-calculator",
    normal: "trayDoseCal",
    hover: "trayDoseCalHover",
    x: -0.228,
    y: 0.17,
    height: 0.363,
    hoverHeight: 0.363,
  },
] as const;

export class MedicationTrayScene extends Phaser.Scene {
  private uiFontFamily = "Arial, sans-serif";
  private origin?: SceneOrigin;
  private hasAnimatedIn = false;
  private isClosing = false;
  private isChildSceneOpen = false;
  private backLabel?: Phaser.GameObjects.Text;
  private backgroundOverlay?: Phaser.GameObjects.Rectangle;
  private trayVisual?: Phaser.GameObjects.Image;
  private sceneContent: Array<
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha
  > = [];
  private trayTarget?: { x: number; y: number; scaleX: number; scaleY: number };

  constructor() {
    super("MedicationTray");
  }

  init(data: { origin?: SceneOrigin } = {}) {
    this.origin = data.origin;
    this.hasAnimatedIn = false;
    this.isClosing = false;
    this.isChildSceneOpen = false;
  }

  preload() {
    this.load.image(
      "medicationTray",
      `/images/game/${encodeURIComponent("ถาดอุปกรณ์.png")}`,
    );
    this.load.image("trayF1", "/images/game/f1.png");
    this.load.image("trayF1Hover", "/images/game/f1_hover.png");
    this.load.image("trayKemAll", "/images/game/kem_all.png");
    this.load.image("trayKemAllHover", "/images/game/kem_all_hover.png");
    this.load.image("trayDoseCal", "/images/game/dosecal.png");
    this.load.image("trayDoseCalHover", "/images/game/dosecal_hover.png");
    this.load.audio("trayIconClick", "/sounds/iconclick.wav");
    this.load.audio("trayDoorSound", "/sounds/door-hard-shut.wav");
    this.load.audio("trayGlassSound", "/sounds/glass-hitting.wav");
    this.load.audio("traySwordUp", "/sounds/sword-up.wav");
    this.load.audio("traySwordDown", "/sounds/sword-down.wav");
  }

  create() {
    const promptFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-prompt")
      .replaceAll('"', "")
      .trim();
    if (promptFont) this.uiFontFamily = `${promptFont}, Arial, sans-serif`;
    this.sound.play("trayIconClick", { volume: 1 });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.draw, this);
    this.draw();
  }

  private draw() {
    if (this.isClosing) return;
    this.children.removeAll(true);
    const { width, height } = this.scale;
    const background = this.add
      .rectangle(width / 2, height / 2, width, height, 0x08100f, 0.62)
      .setDepth(0)
      .setInteractive();
    if (!this.hasAnimatedIn) background.setAlpha(0);

    const trayTexture = this.textures
      .get("medicationTray")
      .getSourceImage() as HTMLImageElement;
    const trayScale = Math.min(
      (width * 0.96) / trayTexture.width,
      (height * 0.92) / trayTexture.height,
    );
    const trayWidth = trayTexture.width * trayScale;
    const trayHeight = trayTexture.height * trayScale;
    const centerX = width / 2;
    const centerY = height / 2;

    const tray = this.add
      .image(centerX, centerY, "medicationTray")
      .setScale(trayScale)
      .setDepth(1);
    const contentStart = this.children.list.length;

    trayItems.forEach((item) => {
      const sprite = this.add.image(
        centerX + trayWidth * item.x,
        centerY + trayHeight * item.y,
        item.normal,
      );
      const normalHeight = trayHeight * item.height;
      const hoverHeight = trayHeight * item.hoverHeight;
      sprite
        .setScale(normalHeight / sprite.height)
        .setDepth(3)
        .setInteractive({ useHandCursor: true });
      sprite.on("pointerover", () => {
        sprite.setTexture(item.hover);
        sprite.setScale(hoverHeight / sprite.height);
      });
      sprite.on("pointerout", () => {
        sprite.setTexture(item.normal);
        sprite.setScale(normalHeight / sprite.height);
      });
      sprite.on("pointerdown", () => {
        this.sound.play("trayGlassSound", { volume: 1.0 });
        this.game.events.emit("medication-item-selected", item.id);
        const sceneKey =
          item.id === "syringe-set"
            ? "MedicationSyringes"
            : item.id === "dose-calculator"
              ? "MedicationDose"
              : "MedicationAspiration";
        this.setChildSceneOpen(true);
        this.scene.pause();
        this.scene.launch(sceneKey);
      });
    });

    this.drawCabinetButton(
      centerX - trayWidth * 0.2,
      centerY - trayHeight * 0.2,
      trayWidth,
    );
    this.drawBackLabel(
      Math.max(24, width * 0.025),
      Math.max(30, height * 0.045),
    );
    this.animateTrayEntry(background, tray, contentStart, trayScale);
  }

  private animateTrayEntry(
    background: Phaser.GameObjects.Rectangle,
    tray: Phaser.GameObjects.Image,
    contentStart: number,
    targetScale: number,
  ) {
    this.backgroundOverlay = background;
    this.trayVisual = tray;
    this.trayTarget = {
      x: tray.x,
      y: tray.y,
      scaleX: targetScale,
      scaleY: targetScale,
    };
    const content = this.children.list.slice(contentStart) as Array<
      Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha
    >;
    this.sceneContent = content;
    if (this.hasAnimatedIn) return;
    this.hasAnimatedIn = true;
    this.sound.play("traySwordUp", { volume: 0.2 });

    content.forEach((child) => child.setAlpha(0));
    if (this.origin) {
      tray.setPosition(this.origin.x, this.origin.y);
      tray.setScale(
        this.origin.width / tray.width,
        this.origin.height / tray.height,
      );
    } else {
      tray.setScale(targetScale * 0.72);
    }
    this.tweens.add({
      targets: background,
      alpha: 1,
      duration: 280,
      ease: "Sine.Out",
    });
    this.tweens.add({
      targets: tray,
      x: this.trayTarget.x,
      y: this.trayTarget.y,
      scaleX: this.trayTarget.scaleX,
      scaleY: this.trayTarget.scaleY,
      duration: 520,
      ease: "Back.Out",
    });
    if (content.length) {
      this.tweens.add({
        targets: content,
        alpha: 1,
        delay: 180,
        duration: 300,
        ease: "Sine.Out",
      });
    }
  }

  private drawCabinetButton(x: number, y: number, trayWidth: number) {
    const buttonWidth = trayWidth * 0.34;
    const buttonHeight = Math.max(72, this.scale.height * 0.112);
    const left = x - buttonWidth / 2;
    const top = y - buttonHeight / 2;
    const shadow = this.add
      .rectangle(x, y + 5, buttonWidth, buttonHeight, 0x201810, 0.42)
      .setDepth(3);
    const door = this.add.graphics().setDepth(4);
    const drawDoor = (isHover = false) => {
      door.clear();
      // A miniature wooden medicine-cabinet door, styled to match the tray artwork.
      door.fillStyle(0x26333a, 1);
      door.fillRoundedRect(left, top, buttonWidth, buttonHeight, 8);
      door.fillStyle(isHover ? 0x718996 : 0x465b66, 1);
      door.fillRoundedRect(
        left + 3,
        top + 3,
        buttonWidth - 6,
        buttonHeight - 6,
        6,
      );
      door.fillStyle(isHover ? 0x9eafb5 : 0x788c95, 1);
      door.fillRoundedRect(
        left + 7,
        top + 7,
        buttonWidth - 14,
        buttonHeight - 14,
        4,
      );
      door.lineStyle(1, 0x455861, 0.95);
      door.strokeRoundedRect(
        left + 11,
        top + 11,
        buttonWidth - 22,
        buttonHeight - 22,
        3,
      );
      door.fillStyle(0xc4d0d2, 0.7);
      door.fillRoundedRect(left + 14, top + 13, buttonWidth * 0.28, 2, 1);
      door.fillStyle(0x35474f, 1);
      door.fillRoundedRect(
        left + buttonWidth * 0.83,
        top + 13,
        3,
        buttonHeight - 26,
        1.5,
      );
      door.fillStyle(0xc2cdd0, 1);
      door.fillRoundedRect(left + buttonWidth * 0.79, y - 8, 9, 16, 3);
      door.fillStyle(0x687b82, 1);
      door.fillRoundedRect(left + buttonWidth * 0.82, y - 5, 3, 10, 1.5);
      door.lineStyle(isHover ? 2 : 1, isHover ? 0xdbe8ec : 0x26333a, 1);
      door.strokeRoundedRect(left, top, buttonWidth, buttonHeight, 8);
    };
    drawDoor();
    const hitArea = this.add
      .rectangle(x, y, buttonWidth, buttonHeight, 0xffffff, 0)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });

    const textX = left + buttonWidth * 0.09;
    const titleSize = Math.max(15, Math.min(22, this.scale.height * 0.02));
    const detailSize = Math.max(10, Math.min(14, this.scale.height * 0.013));
    this.add
      .text(textX, y - buttonHeight * 0.12, "ตู้เก็บยา", {
        fontFamily: this.uiFontFamily,
        fontSize: `${titleSize}px`,
        fontStyle: "bold",
        color: "#fff3dc",
      })
      .setOrigin(0, 0.5)
      .setDepth(7);
    this.add
      .text(textX, y + buttonHeight * 0.2, "เปิดเพื่อหยิบอุปกรณ์", {
        fontFamily: this.uiFontFamily,
        fontSize: `${detailSize}px`,
        color: "#e1cba7",
      })
      .setOrigin(0, 0.5)
      .setDepth(7);

    const arrowX = left + buttonWidth * 0.92;
    const arrowLabel = this.add
      .text(arrowX, y, "›", {
        fontFamily: "Arial, sans-serif",
        fontSize: `${Math.max(24, buttonHeight * 0.43)}px`,
        fontStyle: "bold",
        color: "#f6dbad",
      })
      .setOrigin(0.5)
      .setDepth(8);
    const latch = this.add
      .rectangle(left + buttonWidth * 0.835, y, 5, 12, 0xd5e0e3)
      .setDepth(8);

    hitArea.on("pointerover", () => {
      drawDoor(true);
      this.tweens.killTweensOf([shadow, arrowLabel, latch]);
      this.tweens.add({
        targets: shadow,
        y: y + 8,
        alpha: 0.52,
        duration: 170,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: arrowLabel,
        x: "+=5",
        duration: 170,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: latch,
        x: "+=2",
        duration: 170,
        ease: "Sine.Out",
      });
    });
    hitArea.on("pointerout", () => {
      drawDoor();
      this.tweens.killTweensOf([shadow, arrowLabel, latch]);
      this.tweens.add({
        targets: shadow,
        y: y + 5,
        alpha: 0.42,
        duration: 170,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: arrowLabel,
        x: "-=5",
        duration: 170,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: latch,
        x: "-=2",
        duration: 170,
        ease: "Sine.Out",
      });
    });
    hitArea.on("pointerdown", () => {
      this.tweens.add({
        targets: [arrowLabel, latch],
        scale: 0.88,
        yoyo: true,
        duration: 100,
        ease: "Sine.Out",
      });
      this.sound.play("trayDoorSound", { volume: 0.3 });
      this.game.events.emit("go-to-medicine-cabinet");
      this.setChildSceneOpen(true);
      this.scene.pause();
      this.scene.launch("MedicationCabinet");
    });
  }

  private drawBackLabel(x: number, y: number) {
    const label = this.add
      .text(x, y, "< เตรียมยา", {
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
    this.backLabel = label;
    label.setVisible(!this.isChildSceneOpen);
    label.on("pointerdown", () => this.close());
  }

  public setChildSceneOpen(open: boolean) {
    this.isChildSceneOpen = open;
    this.backLabel?.setVisible(!open);
  }

  private close() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.sound.play("traySwordDown", { volume: 0.2 });
    const finish = () => {
      this.scene.stop();
      this.scene.resume("GameRoom");
    };
    const tray = this.trayVisual;
    const target = this.trayTarget;
    if (!tray || !target) {
      finish();
      return;
    }
    const destination = this.origin
      ? {
          x: this.origin.x,
          y: this.origin.y,
          scaleX: this.origin.width / tray.width,
          scaleY: this.origin.height / tray.height,
        }
      : {
          x: target.x,
          y: target.y,
          scaleX: target.scaleX * 0.72,
          scaleY: target.scaleY * 0.72,
        };
    const content = this.sceneContent;
    if (content.length) {
      this.tweens.killTweensOf(content);
      this.tweens.add({
        targets: content,
        alpha: 0,
        duration: 160,
        ease: "Sine.In",
      });
    }
    if (this.backgroundOverlay) {
      this.tweens.killTweensOf(this.backgroundOverlay);
      this.tweens.add({
        targets: this.backgroundOverlay,
        alpha: 0,
        duration: 340,
        ease: "Sine.In",
      });
    }
    this.tweens.killTweensOf(tray);
    this.tweens.add({
      targets: tray,
      ...destination,
      duration: 390,
      ease: "Cubic.In",
      onComplete: finish,
    });
  }
}
