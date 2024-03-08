import { Color3, CubeTexture, DirectionalLight, Engine, FreeCamera,  Scene, ShadowGenerator, Vector3 } from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";


import Player from './player';
import Arena from './arena';
import { GlobalManager, States } from './globalmanager';

import envSpecularUrl from "../assets/env/environmentSpecular.env";

import { levels } from './levels';

import { InputController } from './inputcontroller';
import { SoundManager } from './soundmanager';


class Game {

    engine;
    canvas;
    scene;


    camera;
    light;

    startTimer;

    player;
    arena;


    bInspector = false;

    currentLevel = 0;

    constructor(engine, canvas) {
        GlobalManager.engine = engine;
        GlobalManager.canvas = canvas;
        GlobalManager.init(canvas, engine);
    }

    async start() {
        this.startTimer = 0;

        await this.initGame();
        GlobalManager.gameState = States.STATE_MENU;

        this.gameLoop();
        this.endGame();


    }
    endGame() {

    }

    async initGame() {

        GlobalManager.gameState = States.STATE_INIT;

        await this.createScene();

        GlobalManager.engine.displayLoadingUI();

        InputController.init();
        await SoundManager.init();

        this.arena = new Arena();
        await this.arena.init();
        await this.arena.loadLevel(levels[this.currentLevel]);

        this.player = new Player();
        await this.player.init();
        this.player.respawn(this.arena.getSpawnPoint());


        GlobalManager.engine.hideLoadingUI();

        //Draw level temporairement ici, manque des fonctions de "restart/respawn"
        this.arena.drawLevel();
        //GlobalManager.scene.createOrUpdateSelectionOctree();
    }


    async gameLoop() {

        const divFps = document.getElementById("fps");
        GlobalManager.engine.runRenderLoop(() => {

            GlobalManager.update();

            InputController.update();
            SoundManager.update();
           
            switch (GlobalManager.gameState) {
                case States.STATE_MENU:
                    //TODO menu
                    GlobalManager.gameState = States.STATE_START_GAME;
                    break;
                case States.STATE_START_GAME:
                    Engine.audioEngine.unlock();
                    SoundManager.playMusic(SoundManager.Musics.GAME_MUSIC);


                    GlobalManager.gameState = States.STATE_LEVEL_READY;
                    break;
                case States.STATE_LEVEL_READY:
                    GlobalManager.gameState = States.STATE_RUNNING;
                    break;

                case States.STATE_RUNNING:
                    this.update();
                    break;

                default:
                    this.update();
            }

            if (InputController.actions["KeyN"]) {
                this.currentLevel++;
                if (this.currentLevel >= levels.length)
                    this.currentLevel = 0;

                GlobalManager.engine.displayLoadingUI();
                this.arena.loadLevel(levels[this.currentLevel]).then( () => {
                    this.player.respawn(this.arena.getSpawnPoint());
                    GlobalManager.engine.hideLoadingUI();
                });

            }

            //Debug
            if (InputController.actions["KeyI"]) {
                this.bInspector = !this.bInspector;

                if (this.bInspector) {
                    GlobalManager.gameCamera.detachControl();
                    GlobalManager.debugCamera.attachControl(this.canvas, true);
                    GlobalManager.scene.activeCamera = GlobalManager.debugCamera;

                    Inspector.Show(GlobalManager.scene, { embedMode: false });
                }
                else {
                    GlobalManager.debugCamera.detachControl();
                    GlobalManager.gameCamera.attachControl(this.canvas, true);
                    GlobalManager.scene.activeCamera = GlobalManager.gameCamera;
                    Inspector.Hide();
                }
            }
            //Reset actions
            InputController.resetActions();
            divFps.innerHTML = GlobalManager.engine.getFps().toFixed() + " fps";
            GlobalManager.scene.render();
        });
    }

    update() {

        this.arena.update();

        this.player.update();


        this.startTimer += GlobalManager.deltaTime;
    }

    async createScene() {

       
        GlobalManager.scene = new Scene(GlobalManager.engine);
        GlobalManager.scene.clearColor = new Color3(0, 0, 0);
        //Pour les collisions internes de babylonjs :
        GlobalManager.scene.collisionsEnabled = true;
        const assumedFramesPerSecond = 60;
        GlobalManager.scene.gravity = new Vector3(0, GlobalManager.gravityVector / assumedFramesPerSecond, 0);
        
        GlobalManager.scene.ambientColor = new Color3(0.9, 0.9, 1);

        // This creates and positions a free camera (non-mesh)
        GlobalManager.gameCamera = new FreeCamera("gameCamera", new Vector3(120, 174, -5), GlobalManager.scene);
        GlobalManager.gameCamera.setTarget(new Vector3(0, 0, 0));
        
        GlobalManager.gameCamera.ellipsoid = new Vector3(1.5, 2, 1.5);

        GlobalManager.gameCamera.wheelPrecision = 0.5; //Mouse wheel speed
        GlobalManager.gameCamera.attachControl(this.canvas, true);
        GlobalManager.gameCamera.angularSensibility = 3000;
        GlobalManager.gameCamera.angularSensibility = 3000;


        GlobalManager.debugCamera = new FreeCamera("debugCam", new Vector3(0, 8, -10), GlobalManager.scene);
        GlobalManager.debugCamera.maxZ = 10000;
        GlobalManager.debugCamera.inputs.addMouseWheel();
        /*
                // Set up new rendering pipeline
                var pipeline = new DefaultRenderingPipeline("default", true, GlobalManager.scene, [GlobalManager.gameCamera]);
        
                // Tone mapping
                GlobalManager.scene.imageProcessingConfiguration.toneMappingEnabled = true;
                GlobalManager.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_STANDARD;
                GlobalManager.scene.imageProcessingConfiguration.exposure = 2;
        */
                let envOptions = {
                    createGround: false,
                    createSkybox : false,
                    cameraExposure : 0.4,
                    environmentTexture : new CubeTexture(envSpecularUrl, GlobalManager.scene),
                };
                GlobalManager.scene.createDefaultEnvironment(envOptions);
                GlobalManager.scene.environmentIntensity = 0.35;
                
                // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
                let light = new DirectionalLight("light", new Vector3(1, 10, 0), GlobalManager.scene);
                light.direction = new Vector3(0.45, -0.47, -0.76);
                light.diffuse = Color3.FromHexString("#703B19");
                light.autoCalcShadowZBounds = true;
                light.autoUpdateExtends = true;
        
                // Default intensity is 1. Let's dim the light a small amount
                light.intensity = 1.0;
                GlobalManager.addLight(light);
        
                let shadowGen = new ShadowGenerator(1024, light);
                shadowGen.useBlurCloseExponentialShadowMap = true;
                GlobalManager.addShadowGenerator(shadowGen);


        SoundManager.playMusic(SoundManager.Musics.MENU_MUSIC);

    }
}

export default Game;