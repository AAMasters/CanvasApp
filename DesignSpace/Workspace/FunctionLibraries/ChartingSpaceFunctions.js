function newChartingSpaceFunctions() {
    thisObject = {
        addAllMineLayers: addAllMineLayers,
        addMissingDashboards: addMissingDashboards,
        addMissingTimeMachines: addMissingTimeMachines,
        createTimeMachine: createTimeMachine
    }

    return thisObject

    function addAllMineLayers(node, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter) {

        /* Validations to see if we can do this or not. */
        if (node.payload === undefined) { return }
        if (node.payload.uiObject === undefined) { return }
        if (node.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage('You need to have a reference parent node to execute this action.')
            return
        }
        if (node.payload.referenceParent.payload === undefined) {
            node.payload.uiObject.setErrorMessage('You need to have a reference parent node to execute this action.')
            return
        }

        /* 
        We are going to go through the referenced branch and recreate the structure
        we find there inside the layers manager. We will end up having at the end
        all layers referencing the data products inside the referenced branch.
        */
        let dataMine = node.payload.referenceParent
        scanBotArray(dataMine.botProducts)

        function scanBotArray(botArray) {
            for (let i = 0; i < botArray.length; i++) {
                let bot = botArray[i]
                let botLayers = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Bot Layers')
                botLayers.name = bot.name

                asymetricalFolderStructureCloning(
                    bot,
                    botLayers,
                    'dataProducts',
                    'dataProductFolders',
                    'layerFolders',
                    'Layer',
                    'Layer Folder',
                    undefined,
                    functionLibraryUiObjectsFromNodes
                )
                /*
                There are some layers that should not exist, for example the ones related to Data Products
                that do not have a plotter module. Since our previous action created all layers no matter
                what, we need now to delete all the ones that do not have a plotter module.
                */
                let allLayers = nodeBranchToArray(botLayers, 'Layer')
                for (let j = 0; j < allLayers.length; j++) {
                    let layer = allLayers[j]

                    let plotterModule = findNodeInNodeMesh(layer, 'Plotter Module', undefined, true, false, false, true)
                    if (plotterModule === undefined) {
                        functionLibraryNodeDeleter.deleteUIObject(layer, rootNodes)
                    }
                }
            }
        }
    }

    function addMissingTimeMachines(node, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter) {
        if (node.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage('This node needs to have a Reference Parent for this command tu run.')
            return
        }

        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === 'Network') {
                let networkNode = rootNode
                scanNetworkNode(networkNode)
            }
        }

        function scanNetworkNode(networkNode) {
            if (networkNode === undefined) { return }

            let backtestingSessionsArray = nodeBranchToArray(networkNode, 'Backtesting Session')
            let fordwardTestingSessionsArray = nodeBranchToArray(networkNode, 'Forward Testing Session')
            let paperTradingSessionsArray = nodeBranchToArray(networkNode, 'Paper Trading Session')
            let liveTradingSessionsArray = nodeBranchToArray(networkNode, 'Live Trading Session')

            scanSessionArray(backtestingSessionsArray)
            scanSessionArray(fordwardTestingSessionsArray)
            scanSessionArray(paperTradingSessionsArray)
            scanSessionArray(liveTradingSessionsArray)

            function scanSessionArray(sessionsArray) {
                for (let i = 0; i < sessionsArray.length; i++) {
                    let session = sessionsArray[i]
                    let environment = findNodeInNodeMesh(session, node.payload.referenceParent.type, undefined, true, false, true, false)
                    if (environment === undefined) { continue }
                    if (environment.id !== node.payload.referenceParent.id) { continue }
                    let market = findNodeInNodeMesh(session, 'Market Trading Tasks', undefined, true, false, true, false)
                    if (market.payload.referenceParent === undefined) { continue }
                    if (isMissingChildren(node, session, true) === true) {
                        createTimeMachine(node, session, market.payload.referenceParent, networkNode, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter)
                    }
                }
            }
        }
    }

    function createTimeMachine(dashboard, session, market, networkNode, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter) {
        let mineProducts
        let timeMachine = functionLibraryUiObjectsFromNodes.addUIObject(dashboard, 'Time Machine')
        timeMachine.payload.referenceParent = session
        timeMachine.name = session.name + ' ' + session.type + ' ' + networkNode.name
        timeMachine.payload.floatingObject.collapseToggle()
        timeMachine.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
        /*
        We need to create a Timeline Chart for each Data Mine Indicators.
        */
        mineProducts = nodeBranchToArray(networkNode, 'Data Mine Products')
        for (let j = 0; j < mineProducts.length; j++) {
            let mineProduct = mineProducts[j]
            /*
            We need to filter out the ones that do not belong to the market where 
            the session is running at. 
            */
            if (mineProduct.payload.parentNode.payload.referenceParent === undefined) { continue }
            if (mineProduct.payload.parentNode.payload.referenceParent.id !== market.id) { continue }

            let timelineChart = functionLibraryUiObjectsFromNodes.addUIObject(timeMachine, 'Timeline Chart')
            timelineChart.name = mineProduct.name
            timelineChart.layersManager.payload.referenceParent = mineProduct
            timelineChart.payload.floatingObject.collapseToggle()
            timelineChart.layersManager.payload.floatingObject.collapseToggle()

            let menu = timelineChart.layersManager.payload.uiObject.menu
            menu.internalClick('Add All Mine Layers')
            menu.internalClick('Add All Mine Layers')
        }

        mineProducts = nodeBranchToArray(networkNode, 'Trading Mine Products')
        for (let j = 0; j < mineProducts.length; j++) {
            let mineProduct = mineProducts[j]
            /*
            The mine products found so far, belongs to any session. To filer all the sessions
            that are not the one we are interested in, we do the following:
            */
            if (mineProduct.payload.parentNode === undefined) { continue }
            if (mineProduct.payload.parentNode.payload.referenceParent.id !== session.id) { continue }
            /*
            At the current version of Superalgos, beta 6, there is only one Trading Mine,
            with only one bot, and it has so many data products that we want to put them
            in 3 different timeline charts. So we will create 3 charts, connect them, 
            and delete from each one 1/3 of the layers. We do all that next:
            */

            for (let k = 0; k < 3; k++) {
                let timelineChart = functionLibraryUiObjectsFromNodes.addUIObject(timeMachine, 'Timeline Chart')

                timelineChart.layersManager.payload.referenceParent = mineProduct
                timelineChart.payload.floatingObject.collapseToggle()
                timelineChart.layersManager.payload.floatingObject.collapseToggle()

                let menu = timelineChart.layersManager.payload.uiObject.menu
                menu.internalClick('Add All Mine Layers')
                menu.internalClick('Add All Mine Layers')

                switch (k) {
                    case 0: {
                        timelineChart.name = 'Trading Engine'
                        deleteNodeByName('Trading System')
                        deleteNodeByName('Objects')
                        break
                    }
                    case 1: {
                        timelineChart.name = 'Trading System'
                        deleteNodeByName('Trading Engine')
                        deleteNodeByName('Objects')
                        break
                    }
                    case 2: {
                        timelineChart.name = 'Objects'
                        deleteNodeByName('Trading Engine')
                        deleteNodeByName('Trading System')
                        break
                    }
                }
                function deleteNodeByName(nodeName) {
                    let nodeToDelete = findNodeInNodeMesh(timelineChart.layersManager, undefined, nodeName, true, true, false, false)
                    if (nodeToDelete === undefined) { return }
                    functionLibraryNodeDeleter.deleteUIObject(nodeToDelete, rootNodes)
                }
            }
        }
    }

    function addMissingDashboards(node, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter) {
        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === 'Network') {
                let network = rootNode
                scanNetwork(network)
            }
        }

        function scanNetwork(network) {
            if (network === undefined) { return }

            for (let j = 0; j < network.networkNodes.length; j++) {
                let networkNode = network.networkNodes[j]
                scanNetworkNode(networkNode)
            }

            function scanNetworkNode(networkNode) {
                let testingEnvironment = findInBranch(networkNode, 'Testing Environment', node, true)
                let productionEnvironment = findInBranch(networkNode, 'Production Environment', node, true)

                if (isMissingChildren(node, testingEnvironment, true) === true) {
                    let dashboard = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Dashboard')
                    dashboard.payload.referenceParent = testingEnvironment
                    dashboard.name = testingEnvironment.type + ' ' + networkNode.name
                }

                if (isMissingChildren(node, productionEnvironment, true) === true) {
                    let dashboard = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Dashboard')
                    dashboard.payload.referenceParent = productionEnvironment
                    dashboard.name = productionEnvironment.type + ' ' + networkNode.name
                }
            }
        }
    }
}
