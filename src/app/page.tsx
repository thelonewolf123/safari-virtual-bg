'use client'

import { useEffect, useRef, useState } from 'react'

import { VirtualBackgroundProcessor } from '@shiguredo/virtual-background'

const assetsPath =
    'https://cdn.jsdelivr.net/npm/@shiguredo/virtual-background@latest/dist'

export default function Home() {
    const [activeBg, setActiveBg] = useState<null | 'blur' | 'kitchen'>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoProcessor = useRef(new VirtualBackgroundProcessor(assetsPath))
    const mediaInit = useRef(false)

    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
    const videoProcessingStarted = useRef(false)

    async function fetchImage(
        pathOrContent: string,
        mode: 'network' | 'base64' = 'network'
    ) {
        if (mode === 'network') {
            const response = await fetch(pathOrContent)
            const blob = await response.blob()
            const image = await createImageBitmap(blob)
            return image
        }

        const image = new Image()
        return new Promise<HTMLImageElement>((resolve, reject) => {
            image.onload = () => resolve(image)
            image.onerror = (err) => reject(err)
            image.src = pathOrContent
        })
    }

    async function handleStream(bg: 'blur' | 'kitchen' | null) {
        setActiveBg(bg)

        if (!videoProcessor.current) return
        if (!videoRef.current) return
        if (!mediaStream) return

        if (videoProcessingStarted.current) {
            videoProcessor.current.stopProcessing()
            videoProcessingStarted.current = false
        }

        if (!bg) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play()
            return
        }

        const steam = mediaStream.getVideoTracks()[0]
        const image = await fetchImage('/kitchen.jpg', 'network')

        const processed_track = await videoProcessor.current.startProcessing(
            steam,
            {
                blurRadius: bg === 'blur' ? 10 : undefined,
                backgroundImage: bg === 'blur' ? undefined : image
            }
        )

        const tracks: MediaStreamTrack[] = [processed_track]

        mediaStream.getTracks().forEach((track) => {
            if (track === steam) return
            tracks.push(track)
        })

        const modifiedStream = new MediaStream(tracks)
        videoRef.current.srcObject = modifiedStream
        videoRef.current.play()

        videoProcessingStarted.current = true
    }

    useEffect(() => {
        if (!videoRef.current) return
        if (mediaInit.current) return

        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                if (!videoRef.current) return
                const videoTrack = stream.getVideoTracks()[0]
                videoRef.current.srcObject = new MediaStream([videoTrack])
                videoRef.current.play()

                console.log(stream)
                setMediaStream(stream)
            })
            .catch((err) => {
                console.error(err)
                mediaInit.current = false
            })

        mediaInit.current = true
    }, [])

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <video ref={videoRef}></video>
            <div className="flex gap-1">
                <button
                    className={`${
                        activeBg === 'blur'
                            ? 'bg-blue-500 hover:bg-blue-700'
                            : 'bg-gray-500 hover:bg-gray-700'
                    }  text-white font-bold py-2 px-4 rounded`}
                    onClick={() => handleStream('blur')}
                >
                    Blur
                </button>
                <button
                    className={`${
                        activeBg === 'kitchen'
                            ? 'bg-blue-500 hover:bg-blue-700'
                            : 'bg-gray-500 hover:bg-gray-700'
                    }  bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
                    onClick={() => handleStream('kitchen')}
                >
                    Kitchen
                </button>

                <button
                    className={`${
                        activeBg === null
                            ? 'bg-blue-500 hover:bg-blue-700'
                            : 'bg-gray-500 hover:bg-gray-700'
                    }  bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
                    onClick={() => handleStream(null)}
                >
                    None
                </button>
            </div>
        </main>
    )
}
