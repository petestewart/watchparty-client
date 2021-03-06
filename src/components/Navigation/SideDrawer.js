import React, { useContext, useState, useEffect } from "react"

import { AuthContext } from "../Auth/AuthProvider"
import { PartyContext } from "../Party/PartyProvider"

import Backdrop from '../UI/Backdrop/Backdrop';


import "./SideDrawer.css"

export const SideDrawer = (props) => {
    const {logoutUser} = useContext(AuthContext)
    const { createInstantParty } = useContext(PartyContext)

    const [sortedChannels, setSortedChannels] = useState([])

    useEffect(() => {
        if (props.userChannels) {
            const channelList = [...props.userChannels]
            channelList.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
            setSortedChannels(channelList)
        }
    }, [props.userChannels])

    return (
        <>
        <Backdrop show={props.open} clicked={props.closedHandler} />
        <div className={`sidedrawer ${props.open ? 'sidedrawer-open' : 'sidedrawer-closed'}`}>
            <ul className="side-menu w-100">
                <li className="sidemenu-item my-3" onClick={() => {
                    props.closedHandler()
                    props.history.push("/parties/upcoming")
                    }}>
                    <span className="menu-icon"><i className="fas fa-calendar-alt"></i></span>My Events
                </li>
                <li className="sidemenu-item my-3" onClick={() => {
                    props.closedHandler()
                    props.history.push("/parties/create")
                    }}>
                    <span className="menu-icon"><i className="fas fa-calendar-plus"></i></span>Schedule Event
                </li>
                <li className="sidemenu-item my-3" onClick={() => {createInstantParty()
                    .then((res) => {
                    props.closedHandler()
                    console.log(res)
                    props.history.push(`/party/${res.id}`)}
                    )}}>
                    <span className="menu-icon"><i className="fas fa-comments"></i></span>Host Instant Event
                </li>
                <hr />
                <li className="my-3"><span className="menu-icon"><i className="fas fa-hashtag"></i></span>My Channels</li>
                {
                    props.userChannels
                    ?   [...new Set([...sortedChannels])].map((channel) => <li className="sidemenu-item my-3" key={channel.id} onClick={() => {
                        props.closedHandler()
                        props.history.push(`/channels/${channel.id}`)
                        }}><span className="menu-icon"><i className="fas"></i></span>#{channel.name}</li>)
                    : ''
                }
                <li className="sidemenu-item my-3" onClick={() => {
                    props.closedHandler()
                    props.history.push("/channels/create")
                    }}>
                    <span className="menu-icon"><i className="fas fa-users"></i></span>Create Channel
                </li>
                <hr />
                {/* TODO: Create 'Invite Friends' feature
                <li className="sidemenu-item my-3">
                    <span className="menu-icon"><i className="fas fa-user-plus"></i></span>Invite Friends
                </li> */}
                <li className="sidemenu-item my-3" onClick={logoutUser}>
                    <span className="menu-icon"><i className="fas fa-sign-out-alt" ></i></span>Sign Out
                </li>
            </ul>
        </div>
        </>
    )
}

