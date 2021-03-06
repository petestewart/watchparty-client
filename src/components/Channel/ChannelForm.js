import React, { useContext, useState, useEffect } from "react"

import { MemberSelector } from '../UI/MemberSelector/MemberSelector'

import { ChannelContext } from "../Channel/ChannelProvider"
import { ProfileContext } from "../Profile/ProfileProvider"

export const ChannelForm = props => {

    const { createChannel, createChannelMember, getChannel, updateChannel, setChannelMemberList, deleteChannel, channel } = useContext(ChannelContext)
    const { profile, getProfile, allProfiles, getAllProfiles } = useContext(ProfileContext)

    const [base64, setBase64] = useState(null)
    const [channelInfo, setChannelInfo] = useState({ name: '', description: '', image: '' })
    const [channelMembers, setChannelMembers] = useState([])
    const [showDeleteWarning, setShowDeleteWarning] = useState(false)

    useEffect(getAllProfiles, [])
    useEffect(getProfile, [])

    // gather channel info if editing existing channel
    useEffect(() => {
        if (props.editExisting) {
            getChannel(props.match.params.id)
                .then((res) => {
                    setChannelInfo({
                        name: res.name,
                        description: res.description,
                        image: res.image,
                        id: props.match.params.id
                    })
                    setChannelMembers(res.members.map(m => m.member_id))
                })
        }
    }, [])

    // convert new image to string
    const getBase64 = (file, callback) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => callback(reader.result))
        reader.readAsDataURL(file)
    }
    const createImageString = (event) => {
        getBase64(event.target.files[0], (base64ImageString) => {
            console.log("Base64 of file is", base64ImageString)
            setBase64(base64ImageString)
        })
    }

    // add or remove member functions
    const addMember = (memberId) => {
        const members = [...channelMembers]
        members.push(memberId)
        setChannelMembers(members)
    };
    const removeMember = (memberId) => {
        const members = [...channelMembers]
        const index = members.indexOf(memberId)
        if (index > -1) {
            members.splice(index, 1)
        }
        setChannelMembers(members)
    }

    // form handlers
    const handleFormInput = (e) => {
        e.preventDefault()
        const formInfo =  { ...channelInfo }
        formInfo[e.target.id] = e.target.value
        setChannelInfo(formInfo)
        };

    const handleFormSubmission = (e) => {
        // function to handle member-list of new channel:
        const handleMemberList = (chId) => {
            channelId = chId
            createChannelMember(channelId, profile.id)
            const promises = []
            channelMembers.forEach((memberId) => {
                promises.push(new Promise((resolve, reject) => {
                    createChannelMember(channelId, memberId)
                        .then(() => resolve({channelId, memberId}))
                        .catch((err) => reject(err))
                }) )
            })
            Promise.all(promises)
                .then(() => {
                    console.log('done')
                    props.history.push(`/channels/${channelId}`)
                })
        }

        // start of form submission handling:
        e.preventDefault()
        let channelId = 0
        if (props.editExisting) {
            updateChannel({...channelInfo, image: base64})
                .then(() => setChannelMemberList(channelInfo.id, [...channelMembers, profile.id]))
                // .then(() => props.history.push(`/channels/${channelInfo.id}`)))
                // TODO: .then isn't working for some reason here, so we are sending user to home page for now. Need to send them to new channel.
                props.history.push('/')
        } else {
            createChannel({...channelInfo, image: base64})
                .then((res) => handleMemberList(res.id))
        }
    };

    // return member icon
    const getMember = (memberId) => {
        const channelMember = allProfiles.find((member) => memberId === member.id)
        if (channelMember)  { return (
        <span 
            className="selected-option"
            key={memberId}>
                {
                    memberId === profile.id
                    ? '*'
                    : <span className="mr-1 remove-selection-button" aria-hidden="true" onClick={() => {removeMember(memberId)}}>&times;</span>
                }
                
                {channelMember.full_name}
            </span>) }
    }

    return(
        /* header */
        <main className="channel-container px-3">
        <h3 className="mt-3 text-center text-warning">{ props.editExisting ? 'Edit' : 'Create' } Channel</h3>

        {/* form */}
        <section>
            <div className="profile-form my-5" onSubmit={handleFormSubmission}>
                <div className="form-group">
                    <label htmlFor="name">Channel Name</label>
                    <input onChange={handleFormInput} type="text" id="name" className="form-control" value={channelInfo.name} required autoFocus />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description/Info</label>
                    <textarea onChange={handleFormInput} className="form-control" id="description" rows="3" value={channelInfo.description}></textarea>
                </div>

                <div className="image-preview-container">
                    {
                        channelInfo.image || base64
                        ? <img className="image-preview" src={base64 || channelInfo.image} alt=""/>
                        : ''
                    }
                </div>
                <div className="form-group">
                    <label htmlFor="image">Profile Pic</label>
                    <input onChange={createImageString} type="file" id="image" className="form-control" />
                </div>

                <div className="channel-members-selector pb-4">
                    <label htmlFor="members">Channel Members</label>
                    <div className="members list mb-2">
                        {[...new Set([profile.id, ...channelMembers])].map((m) => getMember(m))}
                    </div>
                    <MemberSelector options={allProfiles} selected={[...channelMembers, profile.id]} addSelection={addMember} />
                </div>

                {/* submit, delete & cancel buttons */}
                {
                    showDeleteWarning
                    ? ''
                    :   <>
                            <button className="btn btn-success w-100" onClick={handleFormSubmission}>
                                { props.editExisting ? 'Update' : 'Create' } Channel
                            </button>
                            <button className="btn btn-secondary w-100 mt-3 mb-3" onClick={() => {props.history.push("/")}}>Cancel</button>
                            {
                                props.editExisting && channel.creator.id === profile.id
                                ? <button className="btn btn-outline-danger w-100 mt-3 mb-3" onClick={() => {setShowDeleteWarning(true)}}>Delete Channel</button>
                                : ''
                            }
                        </>
                }

                {
                    showDeleteWarning
                    ? <div className="alert alert-danger mt-3" role="alert">
                        Delete this channel?
                        <button className="btn-sm btn-danger ml-3"
                            onClick={() => deleteChannel(channelInfo.id).then(() => {props.history.push("/")})}> 
                            Delete
                        </button>
                        <button className="btn-sm btn-light ml-3"
                            onClick={() => {setShowDeleteWarning(false)}}>
                            Cancel
                        </button>
                    </div>
                    : ''
                }
                
            </div>
        </section>
    </main>
    )
}
