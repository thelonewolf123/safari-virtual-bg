'use client'

import { useEffect, useRef, useState } from 'react'

import { VirtualBackgroundProcessor } from '@shiguredo/virtual-background'

const assetsPath =
    'https://cdn.jsdelivr.net/npm/@shiguredo/virtual-background@latest/dist'

export default function Home() {
    const [activeBg, setActiveBg] = useState<null | 'blur' | 'kitchen'>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoProcessor = useRef(new VirtualBackgroundProcessor(assetsPath))
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
    const videoProcessingStarted = useRef(false)

    async function handleStream(bg: 'blur' | 'kitchen') {
        if (!videoProcessor.current) return
        if (!videoRef.current) return

        setActiveBg(bg)

        const stream = videoRef.current.srcObject as MediaStream
    }

    useEffect(() => {
        if (videoProcessingStarted.current) return

        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            const track = stream.getVideoTracks()[0]

            if (!videoProcessor.current) return
            videoProcessor.current
                .startProcessing(track, {
                    blurRadius: 15 // 背景ぼかし設定
                })
                .then((processed_track) => {
                    if (!videoRef.current) return
                    videoRef.current.srcObject = new MediaStream([
                        processed_track
                    ])
                    videoRef.current.play()
                })
        })

        videoProcessingStarted.current = true
    }, [])

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <video ref={videoRef}></video>
        </main>
    )
}
