function newTaskFunctions() {
    thisObject = {
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
        addMissingExchangeDataTasks: addMissingExchangeDataTasks,
        addMissingMarketDataTasks: addMissingMarketDataTasks,
        addMissingDataMineTasks: addMissingDataMineTasks,
        addAllTasks: addAllTasks
    }

    return thisObject

    function runTask(node, functionLibraryProtocolNode, isDebugging, callBackFunction) {
        if (validations(node) !== true) {
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            return
        }

        let networkNode = node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode
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
            'Market->Exchange Markets->Crypto Exchange->' +
            'Market Base Asset->Market Quoted Asset->Asset->' +
            'Backtesting Session->Live Trading Session->Paper Trading Session->Fordward Testing Session->' +
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
            'Data Mine->'

        let taskDefinition = functionLibraryProtocolNode.getProtocolNode(node, false, true, true, false, false, taskLightingPath)

        let networkLightingPath = '->Network->Network Node->' +
            'Data Storage->Session Independent Data->Exchange Data Products->' +
            'Single Market Data->' +
            'Data Mine Products->Bot Products->' +
            'Data Product Folder->Data Product Folder->Data Product Folder->Data Product Folder->Data Product Folder->' +
            'Data Product->Product Definition->' +
            'Data Mining->Testing Environment->Production Environment->' +
            'Exchange Tasks->Crypto Exchange->' +
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
        if (validations(node) !== true) {
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            return
        }

        let networkNode = node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode
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

        if (node.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside Exchange Tasks.')
            return
        }

        if (node.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside a Testing or Production Environment or a Data Mining node.')
            return
        }

        if (node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside a Network Node.')
            return
        }

        if (node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Task needs to be inside a Network.')
            return
        }

        let networkNode = node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode
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

        return true
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
        for (let i = 0; i < parent.exchangeTasks.length; i++) {
            let node = parent.exchangeTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Task Managers')
            menu.internalClick('Run All Task Managers')
        }
    }

    function stopAllExchangeDataTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.exchangeTasks.length; i++) {
            let node = parent.exchangeTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Task Managers')
            menu.internalClick('Stop All Task Managers')
        }
    }

    function runAllExchangeTradingTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.exchangeTasks.length; i++) {
            let node = parent.exchangeTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Run All Task Managers')
            menu.internalClick('Run All Task Managers')
        }
    }

    function stopAllExchangeTradingTasks(parent, functionLibraryProtocolNode) {
        for (let i = 0; i < parent.exchangeTasks.length; i++) {
            let node = parent.exchangeTasks[i]
            let menu = node.payload.uiObject.menu

            menu.internalClick('Stop All Task Managers')
            menu.internalClick('Stop All Task Managers')
        }
    }

    function addMissingExchangeDataTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === 'Crypto Ecosystem') {
                let cryptoEcosystem = rootNode
                for (let j = 0; j < cryptoEcosystem.cryptoExchanges.length; j++) {
                    let cryptoExchanges = cryptoEcosystem.cryptoExchanges[j]
                    for (let k = 0; k < cryptoExchanges.exchanges.length; k++) {
                        let cryptoExchange = cryptoExchanges.exchanges[k]
                        if (isMissingChildren(node, cryptoExchange, true) === true) {
                            let exchangeDataTasks = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Exchange Data Tasks')
                            exchangeDataTasks.payload.referenceParent = cryptoExchange
                        }
                    }
                }
            }
        }
    }

    function addMissingMarketDataTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        if (node.payload === undefined) { return }
        if (node.payload.referenceParent === undefined) { return }
        if (node.payload.referenceParent.exchangeMarkets === undefined) { return }

        let markets = node.payload.referenceParent.exchangeMarkets.markets

        for (let i = 0; i < markets.length; i++) {
            let market = markets[i]

            if (isMissingChildren(node, market, true) === true) {
                let marketDataTasks = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Market Data Tasks')
                marketDataTasks.payload.referenceParent = market
            }
        }
    }

    function addMissingDataMineTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === 'Data Mine') {
                let dataMine = rootNode

                if (isMissingChildren(node, dataMine, true) === true) {
                    let dataMineTasks = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Data Mine Tasks')
                    dataMineTasks.payload.referenceParent = dataMine
                }
            }
        }
    }

    function addAllTasks(node, rootNodes, functionLibraryUiObjectsFromNodes) {
        if (node.payload === undefined) { return }
        if (node.payload.referenceParent === undefined) { return }

        let dataMine = node.payload.referenceParent

        let taskManager = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Task Manager')

        addTasksForBotArray(dataMine.sensorBots) 
        addTasksForBotArray(dataMine.indicatorBots) 

        function addTasksForBotArray(botsArray) {
            for (let i = 0; i < botsArray.length; i++) {
                let bot = botsArray[i]

                let task = functionLibraryUiObjectsFromNodes.addUIObject(taskManager, 'Task')
                task.name = bot.name

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
                            break
                        }
                    }
                }
            }
        }
    }
}
