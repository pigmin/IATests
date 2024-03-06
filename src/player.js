import { AxesViewer, Color3, MeshBuilder, Quaternion, Scalar, Scene, SceneLoader, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { GlobalManager } from './globalmanager';

import playerMeshUrl from "../assets/models/vehicule_tout_terrain_low_poly.glb";

const SPEED = 15.0;
const TURN_SPEED = 4*Math.PI;

class Player {

    transform;
    mesh;

    axes;

    spawnPoint;

    //Vecteur d'input
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

    update(inputMap, actions) {

        this.getInputs(inputMap, actions);

        this.applyCameraToInputs();
        this.move();
    }

    getInputs(inputMap, actions) {

        this.moveInput.set(0, 0, 0);

        if (inputMap["KeyA"]) {
            this.moveInput.x = -1;
        }
        else if (inputMap["KeyD"]) {
            this.moveInput.x = 1;
        }

        
        if (inputMap["KeyW"]) {
            this.moveInput.z = 1;
        }
        else if (inputMap["KeyS"]) {
            this.moveInput.z = -1;
        }

        if (actions["Space"]) {
            //TODO jump
        }

    }

    applyCameraToInputs() {
        
        this.moveDirection.set(0, 0, 0);

        if (this.moveInput.length() != 0) {

            //Recup le forward de la camera
            let forward = this.getForwardVector(GlobalManager.camera);
            forward.y = 0;
            forward.normalize();
            forward.scaleInPlace(this.moveInput.z);

            //Recup le right de la camera
            let right = this.getRightVector(GlobalManager.camera);
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