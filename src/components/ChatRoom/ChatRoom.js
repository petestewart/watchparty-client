import React, { useState, useContext, useRef, useEffect } from 'react'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import 'firebase/database'
import { useCollectionData } from 'react-firebase-hooks/firestore'

import "./ChatRoom.css"

import { ChatCalibrator } from "./ChatCalibrator"
import { ChatMessage } from './ChatMessage'


// import { firebaseInfo } from "./ChatProvider"
import { ChatContext } from "./ChatProvider"
import { FirebaseContext } from "../Firebase/FirebaseProvider"
import { ProfileContext } from "../Profile/ProfileProvider"



export const ChatRoom = (props) => {

    const firestore = firebase.firestore()

    let clearStatus

    const endOfFeed = useRef();
    const [calibrationMessage, setCalibrationMessage] = useState({})

    const [memberOffsets, setMemberOffsets] = useState([])

    const [statusMessage, setStatusMessage] = useState(' ')
    const [lastTyped, setLastTyped] = useState(0)
    const [currentTypistOffset, setCurrentTypistOffset] = useState(0)

    const { profile } = useContext(ProfileContext)
    const { firebaseInfo } = useContext(FirebaseContext)

    const [currentMessageCount, setCurrentMessageCount] = useState(0)

    const { getAllReactionTypes, reactionTypes } = useContext(ChatContext)

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseInfo);
    } else {
        firebase.app(); // if already initialized, use that one
    }

    useEffect(getAllReactionTypes, [])

    // scroll to end of feed
    const scrollToEnd = () => {
        endOfFeed.current.scrollIntoView({ behavior: 'smooth' })
    }

    // get messages
    const messagesRef = firestore.collection(`party-${props.party.id}`);
    const query = messagesRef.orderBy('createdAt');

    // TODO: check for online status?
        // (works, but need to look at the database to get statuses)
        // var ref = firebase.database().ref(`party-${props.party.id}`);
        // const userOnlineObject = {}
        // const userOfflineObject = {}
        // userOnlineObject[profile.id] = true
        // userOfflineObject[profile.id] = false
        // ref.update({
        //     ...userOnlineObject
        // });
        // ref.onDisconnect().update({
        //     ...userOfflineObject
        // });

    // listen for new messages
    const [messages] = useCollectionData(query, {idField: 'id'});

    // check for system messages
    useEffect(() => {
        let statusMessages = 0
        if (messages) {

            // update chat messages count
            const newMessageCount = messages.filter(msg => !msg.systemMessage).length
            if (newMessageCount !== currentMessageCount) {
                setCurrentMessageCount(newMessageCount)
            }

            // check to see if a calibration request exists:
            let calibratorOpen = false
            let calibrateMessage = null

            // check each system message:
            messages.forEach((m) => {
                if (m.systemMessage) {
                    if (m.messageType === 'calibration_call') {
                        // if an old calibration request exists, delete it, otherwise set current calibration message:
                        if (calibrateMessage) {
                            if (m.id !== calibrateMessage.id) {
                                deleteMessage(calibrateMessage.id)
                            }
                        }
                        calibrateMessage = m
                        calibratorOpen = true
                    }
                    // check for 'is typing' message
                    if (m.messageType === 'isTyping' && m.senderId !== profile.id) {
                        statusMessages += 1
                        const offset = ((m.createdAt.seconds * 1000) + props.timeOffset - m.timeOffset) - Math.floor(new Date().getTime())
                        setCurrentTypistOffset(offset)
                        setTimeout(() => {setStatusMessage(`${m.full_name} is typing...`)}, (offset))
                    }
                }
            })

            // if calibrator is open, check for responses:
            if (calibratorOpen) {
                const responses = []
                
                messages.forEach((m) => { 
                    if (m.systemMessage) {
                        if (m.messageType === 'calibration_response' && m.responseTo === calibrateMessage.id) {
                            if (m.createdAt) {
                                responses.push({ memberId: m.senderId, fullName: m.full_name, createdAt: m.createdAt.seconds })
                            }
                        }
                    }
                })

                // calculate everyone's offset times:
                responses.sort((a, b) => a.createdAt > b.createdAt)
                responses.forEach((res) => {
                    res.offsetAmount = res.createdAt - responses[0].createdAt
                })
                setMemberOffsets(responses)

                // check if user has responded to calibration request:
                responses.forEach((m) => {
                    if (m.memberId === profile.id) {
                        props.setTimeOffset(m.offsetAmount)
                        calibratorOpen=false
                    }
                })
            }

            setCalibrationMessage(calibrateMessage)
            props.setShowCalibrator(calibratorOpen)
            if (statusMessages === 0) {
                setTimeout(() => setStatusMessage(' '), currentTypistOffset)
            }
        }
    }, [messages])

    // form handler:
    const handleFormData = (e) => {
        setFormValue(e.target.value)
    };

    // keystroke handler
    const handleKeystroke = (e) => {
        // send message if user hits return without shift
        if (e.keyCode === 13 && e.shiftKey === false) {
            sendMessage()
        } else {
            // delete "is typing" message after 15 seconds
            if ((new Date().getTime() / 1000) > (lastTyped + 15)) {
                clearTimeout(clearStatus)
                sendIsTypingMessage()
                setLastTyped(new Date().getTime() / 1000)
                clearStatus = setTimeout(() => {deleteMessage(`status-user${profile.id}`)}, 15000)
            }
        }
    };

    // message-sending functions:
    const [formValue, setFormValue] = useState('');

    const sendMessage = async(e) => {
        deleteMessage(`status-user${profile.id}`)
        await messagesRef.add({
        content: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        partyId: props.party.id,
        senderId: profile.id,
        full_name: profile.full_name,
        profile_pic: profile.profile_pic,
        systemMessage: false,
        timeOffset: props.timeOffset
        });
        setFormValue('');
    }

    const sendCalibrationCall = async(cal) => {
        await messagesRef.add({
        content: cal.message,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        partyId: props.party.id,
        senderId: profile.id,
        full_name: profile.full_name,
        profile_pic: profile.profile_pic,
        systemMessage: true,
        messageType: 'calibration_call',
        responseTo: null
        });
    }

    const sendCalibrationResponse = async(calId) => {
        await messagesRef.add({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        partyId: props.party.id,
        senderId: profile.id,
        full_name: profile.full_name,
        profile_pic: profile.profile_pic,
        systemMessage: true,
        messageType: 'calibration_response',
        responseTo: calId
        });
    }

    const sendIsTypingMessage = async() => {
        await messagesRef.doc(`status-user${profile.id}`).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            partyId: props.party.id,
            senderId: profile.id,
            full_name: profile.full_name,
            profile_pic: profile.profile_pic,
            systemMessage: true,
            messageType: 'isTyping',
            timeOffset: props.timeOffset
            });
    }

    const deleteCalibration = (messageId) => {
        // TODO: Fix bug where app crashes on other machines who have responded on cancel
        props.setShowCalibrationForm(false)
        props.setShowCalibrator(false)
        messagesRef.doc(messageId).delete()
        messages.forEach((m) => {
            if (m.systemMessage && m.responseTo === messageId) {
                messagesRef.doc(m.id).delete()
            }
        })
        setCalibrationMessage({})
    };

    const deleteMessage = (messageId) => {
        messagesRef.doc(messageId).delete()
    };

    // TODO: may not need the if statement?
    const updateMessage = (messageId, content) => {
        if (content) {
            messagesRef.doc(messageId).update({ content, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() })
        } else {
            messagesRef.doc(messageId).update({ lastUpdated: firebase.firestore.FieldValue.serverTimestamp() })
        }
    };
    
    return (
        <>
        {
            props.showCalibrator || props.showCalibrationForm
            ? <ChatCalibrator 
                formOpen={props.showCalibrationForm} 
                setFormOpen={props.setShowCalibrationForm} 
                calibratorOpen={props.showCalibrator} 
                setCalibratorOpen={props.setShowCalibrator}
                sendCalibrationCall={sendCalibrationCall}
                sendCalibrationResponse={sendCalibrationResponse}
                calibrationMessage={calibrationMessage}
                deleteCalibration={deleteCalibration}
                profile={profile}
                memberOffsets={memberOffsets}
            />
            : ''
        }

        <div className="chatroom-container">
            <div className="chat-feed">
                <div className="messages">

                {messages && messages.map((msg, i) => 
                    msg.systemMessage
                        ? ''
                        : <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            readerId={profile.id} 
                            deleteMessage={deleteMessage} 
                            updateMessage={updateMessage} 
                            reactionTypes={reactionTypes} 
                            delay={props.timeOffset}
                            isFinalMessage={i === currentMessageCount - 1}
                            scrollToEnd={scrollToEnd}
                            />
                            )}
                </div>
                <div ref={endOfFeed}></div>
            </div>
            <div className="chat-footer">
                <div className="status-ticker">
                    <small className="ml-1">{statusMessage}</small>
                </div>
                <form className="chat-message-form w-100" onSubmit={sendMessage}>
                    <textarea 
                        className="chat-text-input-window w-100"
                        rows="2"
                        value={formValue}
                        onKeyDown={(e) => {handleKeystroke(e)}}
                        onChange={(e) => {handleFormData(e)}}/>
                <div className="message-controls d-flex justify-content-around">
                    <i className="fas fa-paper-plane fa-2x message-button" onClick={sendMessage}></i>
                    {/* TODO: Create emoji response selector functionality 
                    <i className="fas fa-smile fa-2x message-button"></i> */}
                </div>
                </form>
            </div>
        </div>
        </>
    )
    };

