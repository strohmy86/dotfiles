import QtQuick 2.7
import QtGraphicalEffects 1.0

import QtQuick.Particles 2.0
import QtQuick.Window 2.2

Rectangle {

    id: root

    gradient: Gradient {
        GradientStop {
            position: 0
            SequentialAnimation on color {
                loops: Animation.Infinite
                ColorAnimation { from: "#14148c"; to: "#0E1533"; duration: 4000 }
                ColorAnimation { from: "#0E1533"; to: "#14148c"; duration: 4000 }
            }
        }
        GradientStop {
            position: 1
            SequentialAnimation on color {
                loops: Animation.Infinite
                ColorAnimation { from: "#14aaff"; to: "#437284"; duration: 4000 }
                ColorAnimation { from: "#437284"; to: "#14aaff"; duration: 4000 }
            }
        }
    }

    property int stage

    onStageChanged: {
        if (stage == 1) {
            introAnimation.running = true;
        } else if (stage == 5) {
            introAnimation.target = busyIndicator;
            introAnimation.from = 1;
            introAnimation.to = 0;
            introAnimation.running = true;
        }
    }


    ParticleSystem {
        id: estrellas
        anchors.fill: parent
        ImageParticle {
            source: "images/estrella.png"
        }
        // Estrella pequeña
        Emitter {
            anchors.fill: parent
            size: 5
            emitRate: 50
            maximumEmitted: 50
            lifeSpan: 3000; lifeSpanVariation: 500
            velocity: PointDirection {xVariation: 60; y:30; yVariation: 30;}
        }
        // Estrella mediana
        Emitter {
            anchors.fill: parent
            size: 7
            emitRate: 10
            maximumEmitted: 20
            lifeSpan: 3000; lifeSpanVariation: 400
            velocity: PointDirection {xVariation: 60; y:50; yVariation: 25;}
        }
        // Estrella grande
        Emitter {
            anchors.fill: parent
            size: 12
            emitRate: 2
            maximumEmitted: 8
            lifeSpan: 3000; lifeSpanVariation: 300
            velocity: PointDirection {xVariation: 60; y:60; yVariation: 20;}
        }
        Gravity {
            anchors.fill: parent
            angle: 90
            magnitude: 15
        }
        OpacityAnimator {
            from: 0
            to: 1
            duration: 1000
            easing.type: Easing.InOutQuad
        }
    }




    Item {
        id: content
        anchors.fill: parent
        opacity: 0
        TextMetrics {
            id: units
            text: "M"
            property int gridUnit: boundingRect.height
            property int largeSpacing: units.gridUnit
            property int smallSpacing: Math.max(2, gridUnit/4)
        }


        Image {
            id: logo
            property real size: units.gridUnit * 7
            opacity: 0.9
            anchors.centerIn: parent
            source: "images/kde.svg"

            sourceSize.width: size
            sourceSize.height: size
            
            ScaleAnimator on scale {
                from: 0;
                to: 1;
                duration: 1000
            }
            
        }
        
        FontLoader {
         source: "../components/artwork/fonts/OpenSans-Light.ttf"
        }

        Text {
            id: date
            text:Qt.formatDateTime(new Date(),"dddd dd | MMMM")
            font.pointSize: 35
            color: "#a1b4ba"
            font { family: "OpenSans Light"; weight: Font.Light ;capitalization: Font.Capitalize}
            anchors.horizontalCenter: parent.horizontalCenter
            y: (parent.height - height) / 2.7
            
            OpacityAnimator on opacity{
                from: 0
                to: 1
                duration: 400
                easing.type: Easing.InOutQuad
            }
        }

       Image {
            id: cargandoefecto
            y: root.height - (root.height - logo.y) / 1.9 - height/2
            anchors.horizontalCenter: parent.horizontalCenter
            source: "images/eclipse.svg"
            opacity: 0.9
            sourceSize.height: units.gridUnit * 4
            sourceSize.width: units.gridUnit * 4
            
            OpacityAnimator on opacity{
                from: 0
                to: 1
                duration: 1500
                easing.type: Easing.InOutQuad
            }
            
            RotationAnimator on rotation {
                id: rotationAnimator1
                from: 0
                to: 360
                duration: 1500
                loops: Animation.Infinite
            }
            
            ScaleAnimator on scale {
                from: 0;
                to: 1;
                duration: 1500
            }
        }
        
        

         Row {
            spacing: units.smallSpacing*2
            anchors {
                bottom: parent.bottom
                right: parent.right
                rightMargin: units.gridUnit * 1.5
                margins: units.gridUnit
            }
            Image {
                source: "images/fedora.svg"
                sourceSize.height: units.gridUnit * 4
                sourceSize.width: units.gridUnit * 4
                
                OpacityAnimator on opacity{
                    from: 0
                    to: 1
                    duration: 1000
                    easing.type: Easing.InOutQuad
                }

            }
        }
        
        Row {
            spacing: units.smallSpacing*2
            anchors {
                bottom: parent.bottom
                left: parent.left
                rightMargin: units.gridUnit * 1.5
                margins: units.gridUnit
            }
            Text {
                id: fechacompleta
                text:Qt.formatDateTime(new Date(),"dd/MM/yy | hh:mm AP")
                font.pointSize: 12
                color: "#a1b4ba"
                font { family: "OpenSans Light"; weight: Font.Light ;capitalization: Font.Capitalize}
                OpacityAnimator on opacity{
                    from: 0
                    to: 1
                    duration: 400
                    easing.type: Easing.InOutQuad
                }
            }
        }
    
    Row {
            spacing: units.smallSpacing*2
            anchors {
                bottom: parent.bottom
                left: parent.left
                rightMargin: 0
                margins: 0
            }
            Rectangle {
                id: progressBar
                radius: height
                color: "#31363b"
                opacity: 0.9
                height: Math.round(units.gridUnit/6)
                width: Screen.width
                Rectangle {
                    radius: 3
                    anchors {
                        left: parent.left
                        top: parent.top
                        bottom: parent.bottom
                    }
                    width: (root.width/5) * (stage - 1)
                    color: "#bd93f9"
                    Behavior on width {
                        PropertyAnimation {
                            duration: 450
                            easing.type: Easing.InOutQuad
                        }
                    }
                }
            }
        }
  
    }

    
    OpacityAnimator {
        id: introAnimation
        running: false
        target: content
        from: 0
        to: 1
        duration: 1000
        easing.type: Easing.InOutQuad
    }    
}
