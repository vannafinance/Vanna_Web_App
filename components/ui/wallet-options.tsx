'use client'

import * as React from 'react'
import { useConnect, useConnectors } from 'wagmi'

export function WalletOptions({
    open,
    onClose,
}: {
    open: boolean
    onClose: () => void
}) {
    const { connect, isPending, pendingConnector } = useConnect()
    const connectors = useConnectors()

    if (!open) return null

    return (
        <>
            {/* Click outside overlay */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Dropdown */}
            <div className="
        absolute right-0 mt-2 z-50 w-72
        rounded-2xl border border-neutral-800
        bg-neutral-900 shadow-xl
        animate-in fade-in zoom-in-95
      ">
                <div className="p-3 text-sm font-semibold text-neutral-400">
                    Connect Wallet
                </div>

                <div className="px-2 pb-2 space-y-1">
                    {connectors.map((connector) => {
                        const isConnecting =
                            isPending && pendingConnector?.id === connector.id

                        return (
                            <button
                                key={connector.id}
                                type="button"
                                onClick={() => {
                                    connect({ connector })
                                    onClose()
                                }}
                                className="
                  w-full flex items-center gap-3
                  rounded-xl px-3 py-2.5
                  text-left text-sm text-white
                  hover:bg-neutral-800
                  active:scale-[0.98]
                  transition
                "
                            >
                                {/* Icon placeholder */}
                                <span className="h-8 w-8 rounded-full bg-neutral-700" />

                                <span className="flex-1">{connector.name}</span>

                                {isConnecting && (
                                    <span className="text-xs text-blue-400">
                                        Connecting…
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </>
    )
}


