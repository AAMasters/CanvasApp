
function newViewport () {
  const MODULE_NAME = 'Viewport'

  const MIN_ZOOM_LEVEL = 0
  const MAX_ZOOM_LEVEL = 500

  let ANIMATION_INCREMENT = 0.25
  let ANIMATION_STEPS = 5

  let TOP_MARGIN = 40 + TOP_SPACE_HEIGHT
  let BOTTOM_MARGIN = 42 + COCKPIT_SPACE_HEIGHT
  let LEFT_MARGIN = 0
  let RIGHT_MARGIN = 0
  let MARGINS = {
    TOP: TOP_MARGIN,
    BOTTOM: BOTTOM_MARGIN,
    LEFT: LEFT_MARGIN,
    RIGHT: RIGHT_MARGIN
  }

  let thisObject = {
    visibleArea: undefined,
    width: undefined,
    height: undefined,
    eventHandler: undefined,
    zoomTargetLevel: undefined,
    zoomLevel: undefined,
    mousePosition: undefined,
    margins: MARGINS,
    payload: undefined,
    changeZoom: changeZoom,
    onMouseWheel: onMouseWheel,
    transformThisPoint: transformThisPoint,
    unTransformThisPoint: unTransformThisPoint,
    isThisPointVisible: isThisPointVisible,
    isThisPointInViewport: isThisPointInViewport,
    fitIntoVisibleArea: fitIntoVisibleArea,
    fitIntoViewport: fitIntoViewport,
    displace: displace,
    physics: physics,
    raiseEvents: raiseEvents,
    resize: resize,
    initialize: initialize,
    finalize: finalize
  }
  let increment = 0.035
  let position = {
    x: 0,
    y: 0
  }
  let targetPosition = {
    x: 0,
    y: 0
  }
  let positionIncrement = {
    x: 0,
    y: 0
  }
  thisObject.mousePosition = {
    x: 0,
    y: 0
  }
  thisObject.eventHandler = newEventHandler()

/* Initial default value */
  thisObject.zoomLevel = MIN_ZOOM_LEVEL
  thisObject.zoomTargetLevel = MIN_ZOOM_LEVEL
  INITIAL_TIME_PERIOD = recalculatePeriod(thisObject.zoomLevel)

  return thisObject

  function finalize () {
    thisObject.eventHandler.finalize()
    thisObject.payload = undefined
    thisObject = undefined
  }

  function initialize () {
    if (thisObject.payload !== undefined) {
      /* Read the position from the frame structure */

      let frame = {
        position: {
          x: 0,
          y: 0
        }
      }
      loadFrame(thisObject.payload, frame)
      if (!isNaN(frame.position.x)) {
        position.x = frame.position.x
      }
      if (!isNaN(frame.position.y)) {
        position.y = frame.position.y
      }
    }

    resize()
    readObjectState()
  }

  function resize () {
    TOP_MARGIN = 40 + TOP_SPACE_HEIGHT
    BOTTOM_MARGIN = 42 + browserCanvas.height - COCKPIT_SPACE_POSITION
    LEFT_MARGIN = 0
    RIGHT_MARGIN = 0
    MARGINS = {
      TOP: TOP_MARGIN,
      BOTTOM: BOTTOM_MARGIN,
      LEFT: LEFT_MARGIN,
      RIGHT: RIGHT_MARGIN
    }

    thisObject.visibleArea = {
      topLeft: { x: LEFT_MARGIN, y: TOP_MARGIN },
      topRight: { x: browserCanvas.width - RIGHT_MARGIN, y: TOP_MARGIN },
      bottomRight: { x: browserCanvas.width - RIGHT_MARGIN, y: browserCanvas.height - BOTTOM_MARGIN},
      bottomLeft: { x: LEFT_MARGIN, y: browserCanvas.height - BOTTOM_MARGIN}
    }

    thisObject.width = thisObject.visibleArea.topRight.x - thisObject.visibleArea.topLeft.x
    thisObject.height = thisObject.visibleArea.bottomRight.y - thisObject.visibleArea.topLeft.y

    thisObject.center = {
      x: LEFT_MARGIN + thisObject.width / 2,
      y: TOP_MARGIN + thisObject.height / 2
    }
  }

  function raiseEvents () {
    let event = {
      newPosition: position
    }

    thisObject.eventHandler.raiseEvent('Position Changed', event)
  }

  function physics () {
    animationPhysics()
    positioningPhysics()
    readObjectState()
  }

  function positioningPhysics () {
    if (thisObject.payload === undefined) { return }
    /* Save the position at the frame lavel */
    let frame = {}
    frame.position = position
    saveFrame(thisObject.payload, frame)
  }

  function animationPhysics () {
    if (thisObject.zoomLevel < thisObject.zoomTargetLevel) {
      if (thisObject.zoomTargetLevel - thisObject.zoomLevel < ANIMATION_INCREMENT) {
        ANIMATION_INCREMENT = Math.abs(thisObject.zoomTargetLevel - thisObject.zoomLevel)
      }
      thisObject.zoomLevel = thisObject.zoomLevel + ANIMATION_INCREMENT
      changeZoom(thisObject.zoomLevel - ANIMATION_INCREMENT, thisObject.zoomLevel)
    }

    if (thisObject.zoomLevel > thisObject.zoomTargetLevel) {
      if (thisObject.zoomLevel - thisObject.zoomTargetLevel < ANIMATION_INCREMENT) {
        ANIMATION_INCREMENT = Math.abs(thisObject.zoomTargetLevel - thisObject.zoomLevel)
      }
      thisObject.zoomLevel = thisObject.zoomLevel - ANIMATION_INCREMENT
      changeZoom(thisObject.zoomLevel + ANIMATION_INCREMENT, thisObject.zoomLevel)
    }

    if (positionIncrement.y !== 0) {
      if (Math.trunc(Math.abs(targetPosition.y - position.y) * 1000) >= Math.trunc(Math.abs(positionIncrement.y) * 1000)) {
        position.y = position.y + positionIncrement.y
      } else {
        positionIncrement.y = 0
      }
    }
  }

  function onMouseWheel (event) {
    if ((event.ctrlKey === true || event.metaKey === true)) { return }
    let morePower = 1
    let amount = event.delta
    if (event.buttons === 4) { morePower = 2 } // Mouse wheel pressed.
       /* We adjust the sensitivity for Mac Users */
    let isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    if (isMac) { amount = amount / 5 }

    if (thisObject.zoomTargetLevel > 10) {
      amount = amount * 2
    }
    if (thisObject.zoomTargetLevel > 25) {
      amount = amount * 3
    }
    if (thisObject.zoomTargetLevel > 50) {
      amount = amount * 3.5
    }

    if (thisObject.zoomTargetLevel + amount * morePower > MAX_ZOOM_LEVEL) {
      return false
    }
    if (thisObject.zoomTargetLevel + amount * morePower < MIN_ZOOM_LEVEL) {
      return false
    }
    thisObject.zoomTargetLevel = thisObject.zoomTargetLevel + amount * morePower

    ANIMATION_INCREMENT = Math.abs(thisObject.zoomTargetLevel - thisObject.zoomLevel) / ANIMATION_STEPS

    let newEvent = {
      newLevel: thisObject.zoomTargetLevel,
      newPosition: position,
      type: undefined,
      shiftKey: event.shiftKey
    }

    if (amount > 0) {
      newEvent.type = 'Zoom In'
    } else {
      newEvent.type = 'Zoom Out'
    }

    thisObject.eventHandler.raiseEvent('Zoom Changed', newEvent)
    return true
  }

  function fitIntoVisibleArea (point) {
    let pointCopy = {
      x: point.x,
      y: point.y
    }

    /* Here we check the boundaries of the resulting points, so they dont go out of the visible area. */
    if (pointCopy.x > thisObject.visibleArea.bottomRight.x + 1) {
      pointCopy.x = thisObject.visibleArea.bottomRight.x + 1
    }

    if (pointCopy.x < thisObject.visibleArea.topLeft.x - 1) {
      pointCopy.x = thisObject.visibleArea.topLeft.x - 1
    }

    if (pointCopy.y > thisObject.visibleArea.bottomRight.y + 1) {
      pointCopy.y = thisObject.visibleArea.bottomRight.y + 1
    }

    if (pointCopy.y < thisObject.visibleArea.topLeft.y - 1) {
      pointCopy.y = thisObject.visibleArea.topLeft.y - 1
    }

    return pointCopy
  }

  function fitIntoViewport (point) {
    let pointCopy = {
      x: point.x,
      y: point.y
    }
    if (pointCopy.y > COCKPIT_SPACE_POSITION) {
      pointCopy.y = COCKPIT_SPACE_POSITION
    }
    return pointCopy
  }

  function displace (displaceVector, recalculate) {
    position.x = position.x + displaceVector.x
    position.y = position.y + displaceVector.y

    saveObjectState()

    let event = {
      newPosition: position,
      recalculate: recalculate
    }

    thisObject.eventHandler.raiseEvent('Position Changed', event)
  }

  function changeZoom (oldLevel, newLevel) {
    let oldMouse = unTransformThisPoint(thisObject.mousePosition, oldLevel)
    let newMouse = transformThisPoint(oldMouse, newLevel)

    position.x = position.x - newMouse.x + thisObject.mousePosition.x
    position.y = position.y - newMouse.y + thisObject.mousePosition.y

    let testPoint = unTransformThisPoint(thisObject.mousePosition, newLevel)

    saveObjectState()

    targetPosition.x = position.x
    targetPosition.y = position.y

    positionIncrement = {
      x: 0,
      y: 0
    }

    thisObject.eventHandler.raiseEvent('Zoom Changed')
  }

  function transformThisPoint (point, level) {
    let transformedPoint = {
      x: 0,
      y: 0
    }

    if (level === undefined) {
      transformedPoint.x = point.x * (1 + thisObject.zoomLevel) + position.x
      transformedPoint.y = point.y * (1 + thisObject.zoomLevel) + position.y
    } else {
      transformedPoint.x = point.x * (1 + level) + position.x
      transformedPoint.y = point.y * (1 + level) + position.y
    }

    return transformedPoint
  }

  function unTransformThisPoint (point, level) {
    let pointWithoutZoom = {
      x: 0,
      y: 0
    }
    if (level === undefined) {
      pointWithoutZoom.x = (point.x - position.x) / (1 + thisObject.zoomLevel)
      pointWithoutZoom.y = (point.y - position.y) / (1 + thisObject.zoomLevel)
    } else {
      pointWithoutZoom.x = (point.x - position.x) / (1 + level)
      pointWithoutZoom.y = (point.y - position.y) / (1 + level)
    }

    return pointWithoutZoom
  }

  function isThisPointVisible (point) {
    if (point.x < thisObject.visibleArea.topLeft.x || point.x > thisObject.visibleArea.bottomRight.x || point.y < thisObject.visibleArea.topLeft.y || point.y > thisObject.visibleArea.bottomRight.y) {
      return false
    } else {
      return true
    }
  }

  function isThisPointInViewport (point) {
    if (point.y > COCKPIT_SPACE_POSITION) {
      return false
    } else {
      return true
    }
  }

  function saveObjectState () {
    if (thisObject.payload === undefined) { return }

    /* Save the zoom at the node config, so that the user can change it if he wishes to. */
    try {
      let code = JSON.parse(thisObject.payload.node.code)
      code.zoom = (thisObject.zoomTargetLevel - MIN_ZOOM_LEVEL) / (MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) * 100
      code.zoom = code.zoom.toFixed(2)
      thisObject.payload.node.code = JSON.stringify(code)
    } catch (err) {
       // we ignore errors here since most likely they will be parsing errors.
    }
  }

  function readObjectState () {
    if (thisObject.payload === undefined) { return }

    /* Read the zoom level from the node config */
    try {
      let code = JSON.parse(thisObject.payload.node.code)

      if (isNaN(code.zoom) || code.zoom === null || code.zoom === undefined) {
        saveObjectState()
        return
      }
      code.zoom = code.zoom / 100 * (MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) + MIN_ZOOM_LEVEL
      if (code.zoom < MIN_ZOOM_LEVEL) { code.zoom = MIN_ZOOM_LEVEL }
      if (code.zoom > MAX_ZOOM_LEVEL) { code.zoom = MAX_ZOOM_LEVEL }

      if (code.zoom.toFixed(2) !== thisObject.zoomTargetLevel.toFixed(2)) {
        newZoomLevel(code.zoom)
      } else {
        saveObjectState()
      }
    } catch (err) {
       // we ignore errors here since most likely they will be parsing errors.
    }

    function newZoomLevel (level) {
      thisObject.zoomLevel = level
      thisObject.zoomTargetLevel = level
      INITIAL_TIME_PERIOD = recalculatePeriod(level)
      saveObjectState()
      ANIMATION_INCREMENT = 0

      let event = {
        newLevel: thisObject.zoomTargetLevel,
        newPosition: position,
        type: undefined
      }
      thisObject.eventHandler.raiseEvent('Zoom Changed', event)
      return true
    }
  }
}
