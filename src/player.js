import { AxesViewer, Color3, MeshBuilder, Quaternion, Scalar, Scene, SceneLoader, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { GlobalManager } from './globalmanager';

import playerMeshUrl from "../assets/models/vehicule_tout_terrain_low_poly.glb";
import { InputController } from './inputcontroller';
import { Tools } from './tools';

const SPEED = 15.0;
const TURN_SPEED = 4*Math.PI;

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

    constructor(spawnPoint) {
        this.spawnPoint = spawnPoint;
    }

    async init() {
        /*this.mesh = MeshBuilder.CreateBox('playerMesh', {size: 2});
        this.mesh.material = new StandardMaterial("playerMat", GlobalManager.scene);
        this.mesh.material.diffuseColor = new Color3(1, 0, 0);
        this.mesh.visibility = 0.6;*/

        this.transform = new TransformNode("player", GlobalManager.scene);
        this.transform.position = this.spawnPoint.clone();

        const result = await SceneLoader.ImportMeshAsync("", "", playerMeshUrl, GlobalManager.scene);
        //Attention mesh sans vertices !!
        this.mesh = result.meshes[0];
        this.mesh.name = "playerVehicule";
        this.mesh.rotationQuaternion = Quaternion.Identity();
        this.mesh.parent = this.transform;
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

        const poignee = this.mesh.getChildTransformNodes().find( (node) => node.name === 'Object_2');
        let childObj = MeshBuilder.CreateBox("childObj", GlobalManager.scene);
        childObj.setParent(poignee);
        childObj.position.set(0, 0, 0);
        childObj.scaling.set(1, 1, 1)

        //Mesh "Object_11" => Roues
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
            this.transform.position.addInPlace(this.moveDirection);
        }
    }

    getUpVector(_mesh) {
        let up_local = _mesh.getDirection(Vector3.UpReadOnly);
        return up_local.normalize();
    }

    getForwardVector(_mesh) {
        let forward_local = _mesh.getDirection(Vector3.LeftHandedForwardReadOnly);
        return forward_local.normalize();
    }

    getRightVector(_mesh) {
       
        let right_local = _mesh.getDirection(Vector3.RightReadOnly);
        return right_local.normalize();
    }
}

export default Player;