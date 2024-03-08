import { AxesViewer, Color3, MeshBuilder, Quaternion, Scalar, Scene, SceneLoader, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { GlobalManager } from './globalmanager';

import playerMeshUrl from "../assets/models/vehicule_tout_terrain_low_poly.glb";
import { InputController } from './inputcontroller';
import { Tools } from './tools';

const SPEED = 20.0;
const TURN_SPEED = 6*Math.PI;

class Player {

    transform;
    mesh;

    axes;

    spawnPoint;

    //Vecteur d'input
    moveContext;
    moveInput = new Vector3(0, 0, 0);

    //Vecteur de deplacement
    moveDirection = new Vector3(0, 0, 0);

    lookDirectionQuaternion = Quaternion.Identity();

    constructor() {
    }
    
    respawn(spawnPoint) {
        this.spawnPoint = spawnPoint;
        this.mesh.position.copyFrom(this.spawnPoint);
        //On triche un peu sur la hauteur du player car on ne gere pas la gravity pour le moment
        this.mesh.position.y -= 1;
        this.mesh.rotationQuaternion = Quaternion.Identity();
        this.moveDirection.setAll(0);
    }

    async init() {
        const result = await SceneLoader.ImportMeshAsync("", "", playerMeshUrl, GlobalManager.scene);
        //Attention mesh sans vertices !!
        this.mesh = result.meshes[0];
        this.mesh.name = "playerVehicule";
        this.mesh.rotationQuaternion = Quaternion.Identity();
        this.mesh.position = Vector3.Zero();
        
        for (let childMesh of result.meshes) {
            if ((childMesh.name === "Object_3") ||
            (childMesh.name === "Object_5") ||
            (childMesh.name === "Object_4") ||
            (childMesh.name === "Object_11")) {

                childMesh.receiveShadows = true;
                GlobalManager.addShadowCaster(childMesh);
            }
        }

            //Create Visible Ellipsoid around player
            const extra = 0.25
            const headDiam = 1.5;
            const bodyDiam = 2;
            this.mesh.ellipsoid = new Vector3(0.5 * bodyDiam, 0.77 * bodyDiam, 0.5 * bodyDiam);
            this.mesh.ellipsoid.addInPlace(new Vector3(extra, extra, extra));
            const offsetY = 0.5 * (headDiam + bodyDiam) - this.mesh.position.y;
            this.mesh.ellipsoidOffset = new Vector3(0, offsetY, 0);
        
        
    const a = this.mesh.ellipsoid.x;
    const b = this.mesh.ellipsoid.y;
    const points = [];
    for (let theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
        points.push(new Vector3(0, b * Math.sin(theta) + offsetY, a * Math.cos(theta)));
    }

        const ellipse = [];
        ellipse[0] = MeshBuilder.CreateLines("e", { points: points }, GlobalManager.scene);
        ellipse[0].color = Color3.Red();
        ellipse[0].parent = this.mesh;
        const steps = 12;
        const dTheta = 2 * Math.PI / steps;
        for (let i = 1; i < steps; i++) {
            ellipse[i] = ellipse[0].clone("el" + i);
            ellipse[i].parent = this.mesh;
            ellipse[i].rotation.y = i * dTheta;
        }

    }

    update() {

        this.inputMove();

        this.applyCameraToInputs();
        this.move();
    }

    inputMove() {

        this.moveContext = InputController.getAxisVectorP1();

        this.bRun = false;

        if (Math.abs(this.moveContext.length()) < 0.01) {
            this.moveInput.setAll(0);
        }
        else {
            this.moveInput.x = this.moveContext.x;
            this.moveInput.y = 0;
            this.moveInput.z = this.moveContext.y;
            this.bWalking = true;
            this.bRun = InputController.inputMap["ShiftLeft"];
        }

        this.bRunning = this.bRun;
        if (this.bRunning)
            this.bWalking = false;

        this.moveInput.normalize();

    }


    applyCameraToInputs() {
        
        this.moveDirection.set(0, 0, 0);

        if (this.moveInput.length() != 0) {

            //Recup le forward de la camera
            let forward = Tools.getForwardVector(GlobalManager.gameCamera);
            forward.y = 0;
            forward.normalize();
            forward.scaleInPlace(this.moveInput.z);

            //Recup le right de la camera
            let right = Tools.getRightVector(GlobalManager.gameCamera);
            right.y = 0;
            right.normalize();
            right.scaleInPlace(this.moveInput.x);

            //Add les deux vect
            this.moveDirection = right.add(forward);

            //Normalise
            this.moveDirection.normalize();
            
            Quaternion.FromLookDirectionLHToRef(this.moveDirection, Vector3.UpReadOnly, this.lookDirectionQuaternion);
        }
    }

    move() {

        if (this.moveDirection.length() != 0) {

            //Quaternions !!
            Quaternion.SlerpToRef(this.mesh.rotationQuaternion, this.lookDirectionQuaternion,
                 TURN_SPEED * GlobalManager.deltaTime, this.mesh.rotationQuaternion);

            this.moveDirection.scaleInPlace(SPEED * GlobalManager.deltaTime);            
            this.mesh.moveWithCollisions(this.moveDirection);
            let collidedMesh = this.mesh.collider ? this.mesh.collider.collidedMesh : null;
            if (collidedMesh) {
                console.log(collidedMesh);
            }
        }
    }
}

export default Player;