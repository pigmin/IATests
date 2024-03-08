import { SceneLoader, Vector3 } from '@babylonjs/core';
import { GlobalManager } from './globalmanager';

class Arena {

    mesh;

    playerSpawnPoint = Vector3.Zero();

    assetContainer = null;

    exitMesh = null;

    constructor() {
    }

    async init() {

    }

    async loadLevel(level) {

        this.exitMesh = null;

        if (this.assetContainer != null)
            this.disposeLevel();

        this.assetContainer = await SceneLoader.LoadAssetContainerAsync("", level.model, GlobalManager.scene);

        this.assetContainer.addAllToScene();

        for (let aNode of this.assetContainer.transformNodes) {
            if (aNode.name.includes("SPAWN_P")) {
                //Player start 
                this.playerSpawnPoint.copyFrom(aNode.getAbsolutePosition());
                aNode.dispose();
            }
        }

        for (let childMesh of this.assetContainer.meshes) {

            let extras = null;
            if (childMesh.metadata && childMesh.metadata.gltf && childMesh.metadata.gltf.extras) {
                extras = childMesh.metadata.gltf.extras;
                //Recup les datas supp.

                console.log(extras);
            }


            if (childMesh.getTotalVertices() > 0) {
                //Objet 3D

                if (extras) {
                    if (extras.collisions)
                        childMesh.checkCollisions = true;

                    if (extras.exit) {
                        childMesh.checkCollisions = false;
                        childMesh.visibility = 0.0; 
                        this.exitMesh = childMesh;
                    }
                    else {
                        childMesh.receiveShadows = true;
                        GlobalManager.addShadowCaster(childMesh);
                    }
                }                 
            }
            else {
                //RAS
            }

        }


    }

    drawLevel() {
        
    }

    disposeLevel() {
        this.assetContainer.removeAllFromScene();
    }

    getSpawnPoint() {
        return this.playerSpawnPoint.clone();
    }

    getExitMesh() {
        return this.exitMesh;
    }

    update() {

    }

}

export default Arena;