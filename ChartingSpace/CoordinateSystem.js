 ﻿/*

This Object object is responsible for defining the coordinate system in a TimeLine.

The scale on the X axis depends on the time.
The scale on the Y axis depends on the data that wants to be plotted. Usually we need the Max amount on that data to generate a proper scale.

*/

function newCoordinateSystem () {
  let thisObject = {
    min: undefined,
    max: undefined,
    maxHeight: undefined,
    maxWidth: undefined,
    scale: undefined,
    eventHandler: undefined,
    autoMinXScale: true,
    autoMaxXScale: true,
    autoMinYScale: true,
    autoMaxYScale: true,
    physics: physics,
    reportXValue: reportXValue,
    reportYValue: reportYValue,
    zoomX: zoomX,
    zoomY: zoomY,
    recalculateScale: recalculateScale,
    transformThisPoint: transformThisPoint,
    transformThisPoint2: transformThisPoint2,
    unInverseTransform: unInverseTransform,
    inverseTransformUncappedY: inverseTransformUncappedY,
    initializeX: initializeX,
    initializeY: initializeY,
    initialize: initialize,
    finalize: finalize
  }

  thisObject.min = {
    x: 0,
    y: 0
  }
  thisObject.max = {
    x: 0,
    y: 0
  }
  thisObject.scale = {
    x: 0,
    y: 0
  }

  thisObject.eventHandler = newEventHandler()
  thisObject.eventHandler.name = 'Coordinate System'

  let newXMax = -VERY_LARGE_NUMBER
  let newXMin = VERY_LARGE_NUMBER
  let noXValueReported = true

  let newYMax = -VERY_LARGE_NUMBER
  let newYMin = VERY_LARGE_NUMBER
  let noYValueReported = true

  return thisObject

  function finalize () {
    thisObject.eventHandler.finalize()
    thisObject.eventHandler = undefined
  }

  function initialize (minValue, maxValue, pMaxWidth, pMaxHeight) {
    /* Defines the min and max value of rate that we are going to transport to the available screen at the center position. */
    thisObject.min.x = minValue.x
    thisObject.max.x = maxValue.x

    thisObject.min.y = minValue.y
    thisObject.max.y = maxValue.y

    thisObject.maxWidth = pMaxWidth
    thisObject.maxHeight = pMaxHeight

    recalculateScale()
  }

  function physics () {
    let mustRecalculate = false

    if ((thisObject.autoMinXScale === true || thisObject.autoMaxXScale === true) && noXValueReported === false) {
      if (thisObject.autoMaxXScale === true && thisObject.max.x !== newXMax) {
        thisObject.max.x = newXMax
        mustRecalculate = true
      }

      if (thisObject.autoMaxXScale === true) {
        newXMax = -VERY_LARGE_NUMBER
      }

      if (thisObject.autoMinXScale === true && thisObject.min.x !== newXMin) {
        thisObject.min.x = newXMin
        newXMin = VERY_LARGE_NUMBER
        mustRecalculate = true
      }

      if (thisObject.autoMinXScale === true) {
        newXMin = VERY_LARGE_NUMBER
      }

      /* Reseting this to start over at each cycle. */
      noXValueReported = true
    }

    if ((thisObject.autoMinYScale === true || thisObject.autoMaxYScale === true) && noYValueReported === false) {
      if (thisObject.autoMaxYScale === true && thisObject.max.y !== newYMax) {
        thisObject.max.y = newYMax
        mustRecalculate = true
      }

      if (thisObject.autoMaxYScale === true) {
        newYMax = -VERY_LARGE_NUMBER
      }

      if (thisObject.autoMinYScale === true && thisObject.min.y !== newYMin) {
        thisObject.min.y = newYMin
        newYMin = VERY_LARGE_NUMBER
        mustRecalculate = true
      }

      if (thisObject.autoMinYScale === true) {
        newYMin = VERY_LARGE_NUMBER
      }

      /* Reseting this to start over at each cycle. */
      noYValueReported = true
    }

    if (mustRecalculate === true) {
      recalculateScale()
    }
  }

  function reportXValue (value) {
    if (thisObject.autoMinXScale === true) {
      if (value < newXMin) { newXMin = value }
      noXValueReported = false
    }
    if (thisObject.autoMaxXScale === true) {
      if (value > newXMax) { newXMax = value }
      noXValueReported = false
    }
  }

  function reportYValue (value) {
    if (thisObject.autoMinYScale === true) {
      if (value < newYMin) { newYMin = value }
      noYValueReported = false
    }
    if (thisObject.autoMaxYScale === true) {
      if (value > newYMax) { newYMax = value }
      noYValueReported = false
    }
  }

  function zoomX (factor, mousePosition, container) {
    let mouseAtCointainer = unTransformThisPoint(mousePosition, container)
    let leftDistance = mouseAtCointainer.x
    let rightDistance = container.frame.width - mouseAtCointainer.x
    let diff = thisObject.max.x - thisObject.min.x
    let min = thisObject.min.x + diff * factor * leftDistance / (container.frame.width / 2)
    let max = thisObject.max.x - diff * factor * rightDistance / (container.frame.width / 2)

    if (min < max) {
      thisObject.min.x = min
      thisObject.max.x = max
      thisObject.recalculateScale()
    }
  }

  function zoomY (factor, mousePosition, container) {
    let mouseAtCointainer = unTransformThisPoint(mousePosition, container)
    let topDistance = mouseAtCointainer.y
    let bottomDistance = container.frame.height - mouseAtCointainer.y
    let diff = thisObject.max.y - thisObject.min.y
    let min = thisObject.min.y + diff * factor * bottomDistance / (container.frame.height / 2)
    let max = thisObject.max.y - diff * factor * topDistance / (container.frame.height / 2)

    if (min < max) {
      thisObject.min.y = min
      thisObject.max.y = max
      thisObject.recalculateScale()
    }
  }

  function recalculateScale (event) {
    thisObject.scale.x = thisObject.maxWidth / (thisObject.max.x - thisObject.min.x)
    thisObject.scale.y = thisObject.maxHeight / (thisObject.max.y - thisObject.min.y)

    thisObject.eventHandler.raiseEvent('Scale Changed', event)
  }

  function initializeX (minValue, maxValue, maxWidth) {
    thisObject.min.x = minValue.x // * 0.999; // 0.1% less
    thisObject.max.x = maxValue.x // * 1.001; // 0.1% more

    thisObject.scale.x = thisObject.maxWidth / (thisObject.max.x - thisObject.min.x)
  }

  function initializeY (minValue, maxValue, pMaxHeight) {
    thisObject.min.y = minValue.y // * 0.999; // 0.1% less
    thisObject.max.y = maxValue.y // * 1.001; // 0.1% more

    thisObject.scale.y = pMaxHeight / (thisObject.max.y - thisObject.min.y)

    thisObject.maxHeight = pMaxHeight
  }

  function transformThisPoint (point) {
        /*

        This is the straigh fordward transformation this object provides. The input is a point on the data set that wants to be plotted in a timeline.
        The x value of the point must be a datetime.valueOf() and is going to be transformed into an x value on the coordinate system of the timeline.
        The y value should be a value in the dataset at that moment in time. Depending on how this coordinate system was initialized then are the
        possible values y can have. For sure it must be in the range between the min and max y declared at initialization. The y value has a special
        treatment since the browser canvas object used, has a zero y value at the top, while the timeline we use has a zero y value at the botton,
        for that reason y is flipped.

        Besides this, what we do is to multiply by the scale, which in turn is calculated at initialization time depending on the values provided.

        */

    point = {
      x: (point.x - thisObject.min.x) * thisObject.scale.x,
      y: thisObject.maxHeight - (point.y - thisObject.min.y) * thisObject.scale.y
    }

    return point
  }

  function transformThisPoint2 (point) {
    point = {
      x: (point.x - thisObject.min.x) * thisObject.scale.x,
      y: (thisObject.maxHeight - point.y - thisObject.min.y) * thisObject.scale.y
    }

    return point
  }

  function unInverseTransform (point, inverseY) {
    point = {
      x: (point.x / thisObject.scale.x) + thisObject.min.x,
      y: (inverseY - point.y) / thisObject.scale.y + thisObject.min.y
    }

    return point
  }

  function inverseTransformUncappedY (point, inverseY) {
    point = {
      x: (point.x - thisObject.min.x) * thisObject.scale.x,
      y: (inverseY - point.y) * thisObject.scale.y
    }

    return point
  }
}
