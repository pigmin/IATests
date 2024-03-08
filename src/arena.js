import { SceneLoader, Vector3 } from '@babylonjs/core';
import { GlobalManager } from './globalmanager';

class Arena {

    mesh;

    playerSpawnPoint = Vector3.Zero();

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
                childMesh.receiveShadows = true;
                GlobalManager.addShadowCaster(childMesh);
                if (extras) {
                    if (extras.collisions)
                        childMesh.checkCollisions = true;

                    if (extras.exit) {
                        childMesh.onCollideObservable.add(
                            function(mesh, evt){
                                let msg = "Collision with: "+mesh.name;
                                console.log(msg);
                            }
                        );   
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

    getSpawnPoint(playerIndex) {
        return this.playerSpawnPoint.clone();
    }

    update() {

    }

}

export default Arena;