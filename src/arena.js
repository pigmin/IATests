import { MeshBuilder, SceneLoader, Vector3 } from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';



import { GlobalManager } from './globalmanager';

class Arena {

    mesh;

    playerSpawnPoint;

    assetContainer = null;

    constructor() {
    }

    async init() {

    }

    async loadLevel(level) {

        if (this.assetContainer != null)
            this.disposeLevel();

        this.assetContainer = await SceneLoader.LoadAssetContainerAsync("", level.model, GlobalManager.scene);

        this.assetContainer.addAllToScene();

        for (let aNode of this.assetContainer.transformNodes) {
            if (aNode.name.includes("SPAWN_P")) {
                //Player start 
                aNode.computeWorldMatrix(true);
                this.playerSpawnPoint = aNode.getAbsolutePosition();
                aNode.dispose();
            }
        }

        for (let childMesh of this.assetContainer.meshes) {

            if (childMesh.metadata && childMesh.metadata.gltf && childMesh.metadata.gltf.extras) {
                let extras = childMesh.metadata.gltf.extras;
                //Recup les datas supp.

                console.log(extras);
            }



            if (childMesh.getTotalVertices() > 0) {
                //Objet 3D
                childMesh.receiveShadows = true;
                GlobalManager.addShadowCaster(childMesh);
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

    getSpawnPoint(playerIndex) {
        return this.playerSpawnPoint.clone();
    }

    update() {

    }

}

export default Arena;