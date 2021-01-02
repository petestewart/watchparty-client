import React, { useState } from "react"

export const ChannelContext = React.createContext()

export const ChannelProvider = (props) => {

    const [channel, setChannel] = useState({})

    const getChannel = (channelId) => {
        return fetch(`http://localhost:8000/channels/${channelId}`, {
            method : "GET",
            headers: {
                "Authorization": `Token ${localStorage.getItem("watchparty_token")}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        })
            .then(response => response.json())
            .then(setChannel)
            .then(data => {return(data)})
    };

    const createChannel = (channelInfo) => {
        return fetch('http://localhost:8000/channels', {
            method : "POST",
            headers: {
                "Authorization": `Token ${localStorage.getItem("watchparty_token")}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(channelInfo)
        })
            .then(response => response.json())
            .then(data => {return(data)})
    };

    const createChannelMember = (channelId, memberId) => {
        return fetch('http://localhost:8000/channelmembers', {
            method : "POST",
            headers: {
                "Authorization": `Token ${localStorage.getItem("watchparty_token")}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                channel_id: channelId,
                member_id: memberId
            })
        })
            .then(response => response.json())
            .then(data => {return(data)})
    };

    return (
        <ChannelContext.Provider value={{
            channel, createChannel, createChannelMember, getChannel
        }} >
            {props.children}
        </ChannelContext.Provider>
    )
}