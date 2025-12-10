import { sendNotification } from "@/lib/notifications"
import type { Booking } from "@/lib/types"

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || "owner@1-2drive.com"

export async function notifyBookingCreated(booking: Booking) {
  // Notify owner
  await sendNotification({
    userEmail: OWNER_EMAIL,
    userRole: "owner",
    type: "booking_created",
    title: "New Booking Created",
    message: `${booking.customerName} booked ${booking.assetName} from ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`,
    relatedId: booking.id,
    relatedType: "booking",
    sendImmediately: true,
  })

  // Notify customer if they have an email
  if (booking.customerEmail) {
    await sendNotification({
      userEmail: booking.customerEmail,
      userRole: "customer",
      type: "booking_created",
      title: "Booking Confirmed",
      message: `Your booking for ${booking.assetName} from ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()} has been confirmed`,
      relatedId: booking.id,
      relatedType: "booking",
      sendImmediately: true,
    })
  }
}

export async function notifyBookingCancelled(booking: Booking) {
  // Notify owner
  await sendNotification({
    userEmail: OWNER_EMAIL,
    userRole: "owner",
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message: `Booking for ${booking.assetName} by ${booking.customerName} has been cancelled`,
    relatedId: booking.id,
    relatedType: "booking",
    sendImmediately: true,
  })

  // Notify customer if they have an email
  if (booking.customerEmail) {
    await sendNotification({
      userEmail: booking.customerEmail,
      userRole: "customer",
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `Your booking for ${booking.assetName} has been cancelled`,
      relatedId: booking.id,
      relatedType: "booking",
      sendImmediately: true,
    })
  }
}

export async function scheduleUpcomingBookingNotifications(booking: Booking) {
  const startDate = new Date(booking.startDate)
  const endDate = new Date(booking.endDate)
  const now = new Date()

  // Schedule notification 1 day before booking starts
  const oneDayBefore = new Date(startDate)
  oneDayBefore.setDate(oneDayBefore.getDate() - 1)

  if (oneDayBefore > now) {
    // Notify owner
    await sendNotification({
      userEmail: OWNER_EMAIL,
      userRole: "owner",
      type: "booking_start",
      title: "Booking Starting Tomorrow",
      message: `${booking.customerName} - ${booking.assetName} booking starts tomorrow`,
      relatedId: booking.id,
      relatedType: "booking",
      sendAt: oneDayBefore,
    })

    // Notify customer
    if (booking.customerEmail) {
      await sendNotification({
        userEmail: booking.customerEmail,
        userRole: "customer",
        type: "booking_start",
        title: "Your Booking Starts Tomorrow",
        message: `Your booking for ${booking.assetName} starts tomorrow`,
        relatedId: booking.id,
        relatedType: "booking",
        sendAt: oneDayBefore,
      })
    }
  }

  // Schedule notification 1 day before booking ends
  const oneDayBeforeEnd = new Date(endDate)
  oneDayBeforeEnd.setDate(oneDayBeforeEnd.getDate() - 1)

  if (oneDayBeforeEnd > now) {
    // Notify owner
    await sendNotification({
      userEmail: OWNER_EMAIL,
      userRole: "owner",
      type: "booking_end",
      title: "Booking Ending Tomorrow",
      message: `${booking.customerName} - ${booking.assetName} booking ends tomorrow`,
      relatedId: booking.id,
      relatedType: "booking",
      sendAt: oneDayBeforeEnd,
    })

    // Notify customer
    if (booking.customerEmail) {
      await sendNotification({
        userEmail: booking.customerEmail,
        userRole: "customer",
        type: "booking_end",
        title: "Your Booking Ends Tomorrow",
        message: `Your booking for ${booking.assetName} ends tomorrow. Please prepare for return.`,
        relatedId: booking.id,
        relatedType: "booking",
        sendAt: oneDayBeforeEnd,
      })
    }
  }
}
