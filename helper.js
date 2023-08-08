const nodemailer = require("nodemailer");
const ical = require("ical.js");

const processDate = (dateStr) => {
  const dateInfo = dateStr.split("-");
  const year = parseInt(dateInfo[0]);
  const month = parseInt(dateInfo[1]);
  const day = parseInt(dateInfo[2]);
  return {
    year,
    month,
    day,
  };
};

const processTime = (timeStr) => {
  const timeInfo = timeStr.split(":");
  const hours = parseInt(timeInfo[0]);
  const minutes = parseInt(timeInfo[1]);
  return {
    hours,
    minutes,
  };
};

const processInvites = (invitesStr) => {
  const mylist = invitesStr.split(",");
  let invites = [];
  for (let ele of mylist) {
    if (ele.trim() == "") continue;
    invites.push({
      email: ele.trim(),
    });
  }
  return invites;
};

exports.process_csv_formdata = function (csvData) {
  console.log("csvData=", csvData);
  for (let data of csvData) {
    if (
      data["topic"] == "" ||
      data["description"] == "" ||
      data["date"] == "" ||
      data["time"] == "" ||
      data["invities"] == ""
    ) {
      return {
        status_code: 400,
        message: "Invalid file upload",
      };
    }
    const topic = data["topic"];
    const desc = data["description"];
    const { year, month, day } = processDate(data["date"]);
    const { hours, minutes } = processTime(data["time"]);
    let startTimestampStr = `${year} ${month} ${day} ${hours}:${minutes}:00`;
    const startTime = new Date(startTimestampStr);
    startTimestampStr = startTime.toISOString();
    let endTimestampStr = `${year} ${month} ${day} 11:59:00`;
    const endTime = new Date(endTimestampStr);
    endTimestampStr = endTime.toISOString();
    const invites = processInvites(data["invities"]);
    let eventUID = 0;
    console.log("invites=", invites);
    for (let invite of invites) {
      eventUID = eventUID + 1;
      let status = sendEmail(
        invite["email"],
        invites,
        startTimestampStr,
        endTimestampStr,
        topic,
        desc,
        eventUID
      );
      if (status == 500)
        return {
          status_code: 500,
          message: "Error occured while attempting to send the emails",
        };
    }
  }
  return {
    status_code: 200,
    message: "Invites sent sucessfully",
  };
};

function sendEmail(
  invitationEmail,
  attendees,
  startTimestamp,
  endTimestamp,
  invitationTopic,
  invitationDesc,
  eventUID
) {
  console.log("invitationEmail=", invitationEmail);
  // Create an iCal component
  const icalData = {
    prodid: "-//Ananya Sharma//calender-sheduler//EN",
    method: "REQUEST",
    events: [
      {
        start: startTimestamp,
        end: endTimestamp,
        summary: invitationTopic,
        description: invitationDesc,
        uid: `event-id-${eventUID}`,
        attendees: attendees,
      },
    ],
  };
  // Convert jCalData to iCalendar text format
  const icalText = JSON.stringify(icalData);

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "the4musketeeers@gmail.com",
      pass: "jyestailmwokdibd",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  let mailOptions = {
    from: "the4musketeeers@gmail.com",
    to: invitationEmail,
    subject: `Invitation: ${invitationTopic}`,
    html: `You are cordially invited to attend the event.We would be delighted to have your presence grace this occasion.
    Please find attached the event invitation in iCal format.`,
    attachments: [
      {
        filename: "event.ics",
        content: icalText,
      },
    ],
  };

  console.log("email html", mailOptions["html"]);

  transporter.sendMail(mailOptions, function (err, success) {
    if (err) {
      console.log(err);
      return 500;
    } else {
      console.log("Email sent successfully");
      return 200;
    }
  });
}
