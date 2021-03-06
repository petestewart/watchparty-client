import React, { useContext, useEffect } from "react"
import { Link } from "react-router-dom"
import dayjs from 'dayjs'

import { PartyContext } from "../Party/PartyProvider"

export const Home = props => {
    const { getUpcomingParties, upcomingParties, createInstantParty } = useContext(PartyContext)

    // get all the user's upcoming events
    useEffect(getUpcomingParties, [])

    // create a domstring for the user's live and upcoming events
    const userPartiesMessage = () => {
        let livePartiesMessage = ''
        const livePartyList = []
        upcomingParties.forEach((party) => {
            if (
                (dayjs(party.datetime).valueOf()) <= (dayjs(new Date()).valueOf())
                && 
                (dayjs(party.datetime_end).valueOf()) >= (dayjs(new Date()).valueOf())
            ) {
                livePartyList.push(party)
            } 
        })
        if (livePartyList.length > 0) { 
            livePartiesMessage = (<div>
            {livePartyList.length === 1
                ? <span className="text-danger"><Link to={`party/${livePartyList[0].id}`}>{livePartyList[0].title}</Link> is happening now!</span>
                : <span className="text-danger">You have {livePartyList.length} live Events happening now!</span>
            }
            {
                livePartyList.map((party) => (
                    <button className="btn btn-danger w-100 mt-3" key={party.id} onClick={() => {props.history.push(`party/${party.id}`)}}>Join {party.title}</button>
                ))
            }
            </div>)
        }

        const upcomingPartiesMessage = (
            <div className = "mt-5">
                You have {upcomingParties.length - livePartyList.length} upcoming  
                {upcomingParties.length - livePartyList.length === 1
                    ? ' Event'
                    : ' Events'
                }
                <button className="btn btn-primary w-100 mt-3" onClick={() => {props.history.push('/parties/upcoming')}}>
                    View Upcoming {upcomingParties.length - livePartyList.length === 1
                    ? 'Event'
                    : 'Events'
                }
                </button>
            </div>
        )
        
        
    
        return <>{livePartiesMessage}{upcomingParties.length - livePartyList.length > 0 ? upcomingPartiesMessage : ''}</>
    };



    


    return (
        <main className="home-container px-3">
            <h2 className="mt-3 text-center text-warning">ChatSync</h2>
            <section className="mt-5 text-center">
                {userPartiesMessage()}
                <button className="btn btn-primary w-100 mt-3" onClick={() => {props.history.push('/parties/create')}}>Schedule Event</button>
                <button className="btn btn-primary w-100 mt-3 mb-3" onClick={() => {createInstantParty()
                    .then((res) => {
                        console.log(res)
                    props.history.push(`/party/${res.id}`)}
                    )}}>Launch Instant Event</button>
                
            </section>
        </main>
            
    )
}