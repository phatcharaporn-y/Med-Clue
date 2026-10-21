import Phaser from "phaser";

type SettingsPanelOptions = {
  fontFamily?: string;
  folderTextureKey: string;
  exitLabel: string;
  onClose: () => void;
  onExit: () => void;
};

const mutedStorageKey = "medclue-settings-muted";
const volumeStorageKey = "medclue-settings-volume";

export function drawSettingsPanel(
  scene: Phaser.Scene,
  options: SettingsPanelOptions,
) {
  const { width, height } = scene.scale;
  const centerX = width / 2;
  const centerY = height / 2;
  const folderTexture = scene.textures
    .get(options.folderTextureKey)
    .getSourceImage() as HTMLImageElement;
  const folderScale = Math.min(
    (width * 0.68) / folderTexture.width,
    (height * 0.92) / folderTexture.height,
  );
  const panelWidth = folderTexture.width * folderScale;
  const panelHeight = folderTexture.height * folderScale;
  const sound = scene.game.sound;
  const promptFont = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-prompt")
    .replaceAll('"', "")
    .trim();
  const fontFamily =
    options.fontFamily ?? `${promptFont || "Arial"}, Arial, sans-serif`;

  const storedMute = localStorage.getItem(mutedStorageKey);
  const storedVolume = localStorage.getItem(volumeStorageKey);
  if (storedMute !== null) sound.mute = storedMute === "true";
  if (storedVolume !== null && Number.isFinite(Number(storedVolume))) {
    sound.volume = Phaser.Math.Clamp(Number(storedVolume), 0, 1);
  }

  scene.add
    .rectangle(centerX, centerY, width, height, 0x071313, 0.72)
    .setDepth(30)
    .setInteractive();
  scene.add
    .image(centerX, centerY, options.folderTextureKey)
    .setScale(folderScale)
    .setDepth(31);
  scene.add
    .text(centerX, centerY - panelHeight * 0.29, "ตั้งค่าเกม", {
      fontFamily,
      fontSize: `${Math.max(24, Math.min(34, height * 0.032))}px`,
      fontStyle: "bold",
      color: "#35271d",
    })
    .setOrigin(0.5)
    .setDepth(32);
  scene.add
    .rectangle(
      centerX,
      centerY - panelHeight * 0.245,
      panelWidth * 0.55,
      2,
      0x9b7855,
      0.65,
    )
    .setDepth(32);
  scene.add
    .text(centerX, centerY - panelHeight * 0.205, "เสียงและการควบคุม", {
      fontFamily,
      fontSize: `${Math.max(13, Math.min(17, height * 0.015))}px`,
      color: "#735b42",
    })
    .setOrigin(0.5)
    .setDepth(32);

  const soundRowY = centerY - panelHeight * 0.08;
  scene.add
    .text(centerX - panelWidth * 0.27, soundRowY, "เสียงเอฟเฟกต์", {
      fontFamily,
      fontSize: `${Math.max(16, Math.min(20, height * 0.018))}px`,
      fontStyle: "bold",
      color: "#34281f",
    })
    .setOrigin(0, 0.5)
    .setDepth(35);
  const toggle = scene.add
    .rectangle(centerX + panelWidth * 0.22, soundRowY, 112, 38, 0x477263)
    .setStrokeStyle(1, 0x315344)
    .setDepth(32)
    .setInteractive({ useHandCursor: true });
  const toggleLabel = scene.add
    .text(toggle.x, toggle.y, "", {
      fontFamily,
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(33);
  const syncToggle = () => {
    const isMuted = sound.mute;
    toggle.setFillStyle(isMuted ? 0x8a5147 : 0x477263);
    toggleLabel.setText(isMuted ? "ปิดเสียง" : "เปิดเสียง");
  };
  syncToggle();
  toggle.on("pointerdown", () => {
    sound.mute = !sound.mute;
    localStorage.setItem(mutedStorageKey, String(sound.mute));
    syncToggle();
  });

  const volumeLabelY = centerY + panelHeight * 0.035;
  const volumeText = scene.add
    .text(centerX - panelWidth * 0.27, volumeLabelY, "ระดับเสียง", {
      fontFamily,
      fontSize: `${Math.max(16, Math.min(20, height * 0.018))}px`,
      fontStyle: "bold",
      color: "#34281f",
    })
    .setOrigin(0, 0.5)
    .setDepth(32);
  const percentText = scene.add
    .text(
      centerX + panelWidth * 0.27,
      volumeLabelY,
      `${Math.round(sound.volume * 100)}%`,
      {
        fontFamily,
        fontSize: "16px",
        fontStyle: "bold",
        color: "#735b42",
      },
    )
    .setOrigin(1, 0.5)
    .setDepth(32);

  const sliderWidth = panelWidth * 0.58;
  const sliderY = centerY + panelHeight * 0.12;
  const sliderX = centerX;
  scene.add.rectangle(sliderX, sliderY, sliderWidth, 8, 0xcbbda8).setDepth(32);
  const sliderFill = scene.add
    .rectangle(
      sliderX - sliderWidth / 2,
      sliderY,
      sliderWidth * sound.volume,
      8,
      0x557f69,
    )
    .setOrigin(0, 0.5)
    .setDepth(33);
  const knob = scene.add
    .circle(
      sliderX - sliderWidth / 2 + sliderWidth * sound.volume,
      sliderY,
      11,
      0xfaf7ed,
    )
    .setStrokeStyle(2.5, 0x557f69)
    .setDepth(34)
    .setInteractive({ useHandCursor: true });
  const trackHitArea = scene.add
    .rectangle(sliderX, sliderY, sliderWidth, 32, 0xffffff, 0.001)
    .setDepth(33.5)
    .setInteractive({ useHandCursor: true });

  const updateVolume = (pointerX: number) => {
    const nextVolume = Phaser.Math.Clamp(
      (pointerX - (sliderX - sliderWidth / 2)) / sliderWidth,
      0,
      1,
    );
    sound.volume = nextVolume;
    localStorage.setItem(volumeStorageKey, String(nextVolume));
    percentText.setText(`${Math.round(nextVolume * 100)}%`);
    sliderFill.width = sliderWidth * nextVolume;
    knob.x = sliderX - sliderWidth / 2 + sliderWidth * nextVolume;
  };
  trackHitArea.on("pointerdown", (pointer: Phaser.Input.Pointer) =>
    updateVolume(pointer.x),
  );
  knob.on("pointerdown", (pointer: Phaser.Input.Pointer) =>
    updateVolume(pointer.x),
  );
  scene.input.setDraggable(knob);
  knob.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number) =>
    updateVolume(dragX),
  );

  const actionY = centerY + panelHeight * 0.265;
  const closeButton = scene.add
    .rectangle(centerX, actionY, Math.min(220, panelWidth * 0.52), 42, 0x557567)
    .setDepth(32)
    .setInteractive({ useHandCursor: true });
  scene.add
    .text(closeButton.x, closeButton.y, "ปิด", {
      fontFamily,
      fontSize: "17px",
      fontStyle: "bold",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(33);
  closeButton.on("pointerover", () => closeButton.setFillStyle(0x668779));
  closeButton.on("pointerout", () => closeButton.setFillStyle(0x557567));
  closeButton.on("pointerdown", options.onClose);

  const exitY = centerY + panelHeight * 0.355;
  const exitButton = scene.add
    .rectangle(centerX, exitY, Math.min(220, panelWidth * 0.52), 42, 0x80534a)
    .setDepth(32)
    .setInteractive({ useHandCursor: true });
  scene.add
    .text(exitButton.x, exitButton.y, options.exitLabel, {
      fontFamily,
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(33);
  exitButton.on("pointerover", () => exitButton.setFillStyle(0x95645a));
  exitButton.on("pointerout", () => exitButton.setFillStyle(0x80534a));
  exitButton.on("pointerdown", options.onExit);
}
