function newTaskFunctions() {
    thisObject = {
        syncronizeTaskWithBackEnd: syncronizeTaskWithBackEnd,

        runTask: runTask,
        stopTask: stopTask,
        runAllTasks: runAllTasks,
        stopAllTasks: stopAllTasks,
        runAllTaskManagers: runAllTaskManagers,
        stopAllTaskManagers: stopAllTaskManagers,

        runAllExchangeDataTasks: runAllExchangeDataTasks,
        stopAllExchangeDataTasks: stopAllExchangeDataTasks,
        runAllExchangeTradingTasks: runAllExchangeTradingTasks,
        stopAllExchangeTradingTasks: stopAllExchangeTradingTasks,

        runAllMarketDataTasks: runAllMarketDataTasks,
        stopAllMarketDataTasks: stopAllMarketDataTasks,
        runAllMarketTradingTasks: runAllMarketTradingTasks,
        stopAllMarketTradingTasks: stopAllMarketTradingTasks,

        runAllDataMineTasks: runAllDataMineTasks,
        stopAllDataMineTasks: stopAllDataMineTasks,
        runAllTradingMineTasks: runAllTradingMineTasks,
        stopAllTradingMineTasks: stopAllTradingMineTasks,

        addMissingExchangeDataTasks: addMissingExchangeDataTasks,
        addMissingMarketDataTasks: addMissingMarketDataTasks,
        addMissingDataMineTasks: addMissingDataMineTasks,
        addMissingExchangeTradingTasks: addMissingExchangeTradingTasks,
        addMissingMarketTradingTasks: addMissingMarketTradingTasks,
        addMissingTradingMineTasks: addMissingTradingMineTasks,
        addAllTasks: addAllTasks
    }

    return thisObject

    function syncronizeTaskWithBackEnd(node) {
        let networkNode = validations(node)
        if (networkNode === undefined) {
            /* Nodes that do not belong to a network can not get ready. */
            return
        }

        let eventsServerClient = canvas.designSpace.workspace.eventsServerClients.get(networkNode.id)

        /* First we setup everything so as to listen to the response from the Task Manger */
        let eventSubscriptionIdOnStatus
        let key = 'Task Client - ' + node.id
        eventsServerClient.listenToEvent(key, 'Task Status', undefined, node.id, onResponse, onStatus)

        function onResponse(message) {
            eventSubscriptionIdOnStatus = message.eventSubscriptionId
        }

        function onStatus(message) {
            eventsServerClient.stopListening(key, eventSubscriptionIdOnStatus, node.id)
            if (message.event.status === 'Task Process Running' ) {
                node.payload.uiObject.menu.internalClick('Run Task')
            }
        }

        /* Second we ask the Task Manager if this Task has a process Running. */
        let event = {
            taskId: node.id
        }

        eventsServerClient.raiseEvent('Task Manager', 'Task Status', event)
    }

    function runTask(node, functionLibraryProtocolNode, isDebugging, callBackFunction) {

        let networkNode = validations(node)
        if (networkNode === undefined) {
            /* This means that the validations failed. */
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            return
        }

        let eventsServerClient = canvas.designSpace.workspace.eventsServerClients.get(networkNode.id)

        for (let i = 0; i < node.bot.processes.length; i++) {
            let process = node.bot.processes[i]
            process.payload.uiObject.run(eventsServerClient)
        }

        let taskLightingPath = '->Task->' +
            'Sensor Bot Instance->' +
            'Indicator Bot Instance->Time Frames Filter->' +
            'Trading Bot Instance->' +
            'Sensor Process Instance->Indicator Process Instance->Trading Process Instance->' +
            'Execution Started Event->' +
            'Key Reference->Exchange Account Key->' +
            'Task Manager->' +
            'Data Mine Tasks->Trading Mine Tasks->' +
            'Market Data Tasks->Market Trading Tasks->' +
            'Exchange Data Tasks->Exchange Trading Tasks->' +
            'Market->Exchange Markets->Crypto Exchange->' +
            'Market Base Asset->Market Quoted Asset->Asset->' +
            'Backtesting Session->Live Trading Session->Paper Trading Session->Forward Testing Session->' +
            'Process Definition->' +
            'Process Output->' +
            'Output Dataset Folder->Output Dataset Folder->Output Dataset Folder->Output Dataset Folder->Output Dataset Folder->' +
            'Output Dataset->Dataset Definition->Product Definition->' +
            'Process Dependencies->' +
            'Status Dependency->Status Report->Process Definition->' +
            'Data Mine Data Dependencies->Bot Data Dependencies->' +
            'Data Dependency Folder->Data Dependency Folder->Data Dependency Folder->Data Dependency Folder->Data Dependency Folder->' +
            'Data Dependency->Dataset Definition->Product Definition->' +
            'Record Definition->Record Property->Formula->' +
            'Data Building Procedure->' +
            'Procedure Initialization->Javascript Code->' +
            'Procedure Loop->Javascript Code->' +
            'Calculations Procedure->' +
            'Procedure Initialization->Javascript Code->' +
            'Procedure Loop->Javascript Code->' +
            'Status Report->' +
            'Execution Finished Event->' +
            'Execution Started Event->Execution Finished Event->Process Definition->' +
            'Sensor Bot->' +
            'Product Definition Folder->Product Definition Folder->Product Definition Folder->Product Definition Folder->Product Definition Folder->' +
            'Indicator Bot->' +
            'Trading Bot->' +
            'Data Mine->Trading Mine->'

        let taskDefinition = functionLibraryProtocolNode.getProtocolNode(node, false, true, true, false, false, taskLightingPath)

        let networkLightingPath = '->Network->Network Node->' +
            'Data Storage->Data Mines Data->Exchange Data Products->' +
            'Market Data Products->' +
            'Data Mine Products->Bot Products->' +
            'Data Product Folder->Data Product Folder->Data Product Folder->Data Product Folder->Data Product Folder->' +
            'Data Product->Product Definition->' +
            'Data Mining->Testing Environment->Production Environment->' +
            'Exchange Data Tasks->Exchange Trading Tasks->Crypto Exchange->' +
            'Market Data Tasks->Market Trading Tasks->Market->' +
            'Data Mine Tasks->Trading Mine Tasks->' +
            'Task Manager->Task->' +
            'Indicator Bot Instance->Sensor Bot Instance->Trading Bot Instance->' +
            'Indicator Process Instance->Sensor Process Instance->Trading Process Instance->' +
            'Paper Trading Session->Forward Testing Session->Backtesting Session->Live Trading Session->' +
            'Market->' +
            'Process Definition->'

        let networkDefinition = functionLibraryProtocolNode.getProtocolNode(networkNode.payload.parentNode, false, true, true, false, false, networkLightingPath)

        let event = {
            appSchema: JSON.stringify(APP_SCHEMA_ARRAY),
            taskId: node.id,
            taskName: node.name,
            taskDefinition: JSON.stringify(taskDefinition),
            networkDefinition: JSON.stringify(networkDefinition)
        }

        if (isDebugging === true) {
            callBackFunction(GLOBAL.DEFAULT_OK_RESPONSE)
            eventsServerClient.raiseEvent('Task Server', 'Debug Task Started', event)
            return
        }

        node.payload.uiObject.run(eventsServerClient, callBackFunction)
        eventsServerClient.raiseEvent('Task Manager', 'Run Task', event)
    }

    function stopTask(node, functionLibraryProtocolNode, callBackFunction) {
        let networkNode = validations(node)
        if (networkNode === undefined) {
            /* This means that the validations failed. */
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            return
        }
        let eventsServerClient = canvas.designSpace.workspace.eventsServerClients.get(networkNode.id)

        let event = {
            taskId: node.id,
            taskName: node.name
        }

        node.payload.uiObject.stop(callBackFunction)
        eventsServerClient.raiseEvent('Task Manager', 'Stop Task', event)

        if (node.bot === undefined) { return }
        if (node.bot.processes.length === 0) { return }

        for (let i = 0; i < node.bot.processes.length; i++) {
            let process = node.bot.processes[i]
            process.payload.uiObject.stop()
        }
    }

    function validations(node) {
        if (node.bot === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to have a Bot Instance.')
            return
        }
        if (node.bot.processes.length === 0) {
            node.payload.uiObject.setErrorMessage('Task Bot Instance needs to have al least once Process Instance.')
            return
        }

        if (node.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside a Task Manager.')
            return
        }

        let taskManager = node.payload.parentNode

        if (taskManager.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside Mine Tasks.')
            return
        }

        if (taskManager.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside Market Tasks.')
            return
        }

        if (taskManager.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside Exchange Tasks.')
            return
        }

        if (taskManager.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside a Data Mining, Testing or Production Environment.')
            return
        }

        if (taskManager.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside a Network Node.')
            return
        }

        let networkNode = taskManager.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode
        if (loadPropertyFromNodeConfig(networkNode.payload, 'host') === undefined) {
            node.payload.uiObject.setErrorMessage('Network Node needs to have a valid Host property at its config.')
            return
        }

        if (loadPropertyFromNodeConfig(networkNode.payload, 'webPort') === undefined) {
            node.payload.uiObject.setErrorMessage('Network Node needs to have a valid webPort property at its config.')
            return
        }

        if (loadPropertyFromNodeConfig(networkNode.payload, 'webSocketsPort') === undefined) {
            node.payload.uiObject.setErrorMessage('Network Node needs to have a valid webSocketsPort property at its config.')
            return
        }

        return networkNode
    }

    function runAllTasks(taskManager, functionLibraryProtocolNode) {
        for (let i = 0; i < taskManager.tasks.length; i++) {
            let node = taskManager.tasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run Task')
        }
    }

    function stopAllTasks(taskManager, functionLibraryProtocolNode) {
        for (let i = 0; i < taskManager.tasks.length; i++) {
            let node = taskManager.tasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop Task')
        }
    }

    function runAllTaskManagers(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.taskManagers.length; i++) {
            let node = parent.taskManagers[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Tasks')
            menu.internalClick('Run All Tasks')
        }
    }

    function stopAllTaskManagers(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.taskManagers.length; i++) {
            let node = parent.taskManagers[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Tasks')
            menu.internalClick('Stop All Tasks')
        }
    }

    function runAllExchangeDataTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.exchangeDataTasks.length; i++) {
            let node = parent.exchangeDataTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Market Data Tasks')
            menu.internalClick('Run All Market Data Tasks')
        }
    }

    function stopAllExchangeDataTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.exchangeDataTasks.length; i++) {
            let node = parent.exchangeDataTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Market Data Tasks')
            menu.internalClick('Stop All Market Data Tasks')
        }
    }

    function runAllExchangeTradingTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.exchangeTradingTasks.length; i++) {
            let node = parent.exchangeTradingTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Market Trading Tasks')
            menu.internalClick('Run All Market Trading Tasks')
        }
    }

    function stopAllExchangeTradingTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.exchangeTradingTasks.length; i++) {
            let node = parent.exchangeTradingTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Market Trading Tasks')
            menu.internalClick('Stop All Market Trading Tasks')
        }
    }

    function runAllMarketDataTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.marketDataTasks.length; i++) {
            let node = parent.marketDataTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Data Mine Tasks')
            menu.internalClick('Run All Data Mine Tasks')
        }
    }

    function stopAllMarketDataTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.marketDataTasks.length; i++) {
            let node = parent.marketDataTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Data Mine Tasks')
            menu.internalClick('Stop All Data Mine Tasks')
        }
    }

    function runAllMarketTradingTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.marketTradingTasks.length; i++) {
            let node = parent.marketTradingTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Trading Mine Tasks')
            menu.internalClick('Run All Trading Mine Tasks')
        }
    }

    function stopAllMarketTradingTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.marketTradingTasks.length; i++) {
            let node = parent.marketTradingTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Trading Mine Tasks')
            menu.internalClick('Stop All Trading Mine Tasks')
        }
    }

    function runAllDataMineTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.dataMineTasks.length; i++) {
            let node = parent.dataMineTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Task Managers')
            menu.internalClick('Run All Task Managers')
        }
    }

    function stopAllDataMineTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.dataMineTasks.length; i++) {
            let node = parent.dataMineTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Task Managers')
            menu.internalClick('Stop All Task Managers')
        }
    }

    function runAllTradingMineTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.tradingMineTasks.length; i++) {
            let node = parent.tradingMineTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Task Managers')
            menu.internalClick('Run All Task Managers')
        }
    }

    function stopAllTradingMineTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.tradingMineTasks.length; i++) {
            let node = parent.tradingMineTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Task Managers')
            menu.internalClick('Stop All Task Managers')
        }
    }

    function addMissingExchangeDataTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        addMissingExchangeTasks(node, rootNodes, 'Exchange Data Tasks', functionLibraryUiObjectsFromNodes)
    }

    function addMissingExchangeTradingTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        addMissingExchangeTasks(node, rootNodes, 'Exchange Trading Tasks', functionLibraryUiObjectsFromNodes)
    }

    function addMissingExchangeTasks(node, rootNodes, newNodeType, functionLibraryUiObjectsFromNodes) {
        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === 'Crypto Ecosystem') {
                let cryptoEcosystem = rootNode
                for (let j = 0; j < cryptoEcosystem.cryptoExchanges.length; j++) {
                    let cryptoExchanges = cryptoEcosystem.cryptoExchanges[j]
                    for (let k = 0; k < cryptoExchanges.exchanges.length; k++) {
                        let cryptoExchange = cryptoExchanges.exchanges[k]
                        if (isMissingChildren(node, cryptoExchange, true) === true) {
                            let exchangeTasks = functionLibraryUiObjectsFromNodes.addUIObject(node, newNodeType)
                            exchangeTasks.payload.referenceParent = cryptoExchange
                        }
                    }
                }
            }
        }
    }

    function addMissingMarketDataTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        addMissingMarketTasks(node, rootNodes, 'Market Data Tasks', functionLibraryUiObjectsFromNodes)
    }

    function addMissingMarketTradingTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        addMissingMarketTasks(node, rootNodes, 'Market Trading Tasks', functionLibraryUiObjectsFromNodes)
    }

    function addMissingMarketTasks(node, rootNodes, newNodeType, functionLibraryUiObjectsFromNodes) {
        if (node.payload === undefined) { return }
        if (node.payload.referenceParent === undefined) { return }
        if (node.payload.referenceParent.exchangeMarkets === undefined) { return }

        let markets = node.payload.referenceParent.exchangeMarkets.markets

        for (let i = 0; i < markets.length; i++) {
            let market = markets[i]

            if (isMissingChildren(node, market, true) === true) {
                let marketDataTasks = functionLibraryUiObjectsFromNodes.addUIObject(node, newNodeType)
                marketDataTasks.payload.referenceParent = market
            }
        }
    }

    function addMissingDataMineTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        addMissingMineTasks(node, rootNodes, 'Data Mine', 'Data Mine Tasks', functionLibraryUiObjectsFromNodes)
    }

    function addMissingTradingMineTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        addMissingMineTasks(node, rootNodes, 'Trading Mine', 'Trading Mine Tasks', functionLibraryUiObjectsFromNodes)
    }

    function addMissingMineTasks(node, rootNodes, rootNodeType, newNodeType, functionLibraryUiObjectsFromNodes) {
        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === rootNodeType) {
                let dataMine = rootNode

                if (isMissingChildren(node, dataMine, true) === true) {
                    let dataMineTasks = functionLibraryUiObjectsFromNodes.addUIObject(node, newNodeType)
                    dataMineTasks.payload.referenceParent = dataMine
                }
            }
        }
    }

    function addAllTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        if (node.payload === undefined) { return }
        if (node.payload.referenceParent === undefined) { return }

        let taskManager = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Task Manager')
        taskManager.name = node.payload.referenceParent.name
        taskManager.payload.floatingObject.collapseToggle()

        switch (node.type) {
            case 'Data Mine Tasks': {
                addDataTasks()
                break
            }
            case 'Trading Mine Tasks': {
                addTradingTasks()
                break
            }
        }

        function addDataTasks() {
            addTaskForTradinSystem()
        }

        function addTradingTasks() {
            for (let i = 0; i < rootNodes.length; i++) {
                let rootNode = rootNodes[i]
                if (rootNode.type === 'Trading System') {
                    addTaskForTradinSystem(rootNode)
                }
            }
        }

        function addTaskForTradinSystem(tradingSystem) {
            let mine = node.payload.referenceParent

            addTasksForBotArray(mine.sensorBots)
            addTasksForBotArray(mine.indicatorBots)
            addTasksForBotArray(mine.tradingBots)

            function addTasksForBotArray(botsArray) {
                if (botsArray === undefined) { return }

                for (let i = 0; i < botsArray.length; i++) {
                    let bot = botsArray[i]

                    let task = functionLibraryUiObjectsFromNodes.addUIObject(taskManager, 'Task')

                    if (tradingSystem !== undefined) {
                        task.name = tradingSystem.name
                    } else {
                        task.name = bot.name
                    }

                    let botInstance
                    switch (bot.type) {
                        case 'Sensor Bot': {
                            botInstance = functionLibraryUiObjectsFromNodes.addUIObject(task, 'Sensor Bot Instance')
                            botInstance.name = bot.name
                            break
                        }
                        case 'Indicator Bot': {
                            botInstance = functionLibraryUiObjectsFromNodes.addUIObject(task, 'Indicator Bot Instance')
                            botInstance.name = bot.name
                            break
                        }
                        case 'Trading Bot': {
                            botInstance = functionLibraryUiObjectsFromNodes.addUIObject(task, 'Trading Bot Instance')
                            botInstance.name = bot.name
                            break
                        }
                    }

                    for (let j = 0; j < bot.processes.length; j++) {
                        let process = bot.processes[j]
                        let processInstance
                        switch (bot.type) {
                            case 'Sensor Bot': {
                                processInstance = functionLibraryUiObjectsFromNodes.addUIObject(botInstance, 'Sensor Process Instance')
                                processInstance.payload.referenceParent = process
                                break
                            }
                            case 'Indicator Bot': {
                                processInstance = functionLibraryUiObjectsFromNodes.addUIObject(botInstance, 'Indicator Process Instance')
                                processInstance.payload.referenceParent = process
                                break
                            }
                            case 'Trading Bot': {
                                processInstance = functionLibraryUiObjectsFromNodes.addUIObject(botInstance, 'Trading Process Instance')
                                processInstance.payload.referenceParent = process

                                if (node.payload.parentNode === undefined) { return }
                                if (node.payload.parentNode.payload === undefined) { return }
                                if (node.payload.parentNode.payload.parentNode === undefined) { return }
                                if (node.payload.parentNode.payload.parentNode.payload === undefined) { return }
                                if (node.payload.parentNode.payload.parentNode.payload.parentNode === undefined) { return }

                                let environment = node.payload.parentNode.payload.parentNode.payload.parentNode
                                let session

                                switch (environment.type) {
                                    case 'Testing Environment': {
                                        addSession('Backtesting Session')
                                        break
                                    }
                                    case 'Production Environment': {
                                        addSession('Live Trading Session')
                                        break
                                    }
                                }
                                break

                                function addSession(sessionType) {
                                    session = functionLibraryUiObjectsFromNodes.addUIObject(processInstance, sessionType)
                                    session.name = task.name
                                    let config = JSON.parse(session.config)
                                    config.folderName = session.name.split(" ").join("-")
                                    session.config = JSON.stringify(config)

                                    for (let m = 0; m < rootNodes.length; m++) {
                                        let rootNode = rootNodes[m]
                                        if (rootNode.type === 'Trading Engine' && rootNode.isIncluded === true) {
                                            let tradingEngine = rootNode
                                            session.tradingEngineReference.payload.referenceParent = tradingEngine
                                            session.tradingSystemReference.payload.referenceParent = tradingSystem
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
