import { apiURL } from "../../../../redux/actions";
import { _updateApi } from "../../../../redux/actions/api";
import moment from "moment";
import store from "../../../../redux/store";
import { processLabTransaction } from "./processLabTransaction";

export const generateLabBookingNo = (cb = (f) => f, error = (f) => f) => {
  const monthCode = moment().format("MM");
  const yearCode = moment().format("YY");
  const facilityId = store.getState().auth.user.facilityId;

  // fetch(`${apiURL()}/lab/next/id/${facilityId}`)
  //   .then((raw) => raw.json())
  //   .then((data) => {
  // if (data.success) {
  fetch(`${apiURL()}/lab/next/monthid/${facilityId}`)
    .then((raw) => raw.json())
    .then((data) => {
      if (data.success) {
        let idForMonth = data.results.labId;
        let fullcode = `${monthCode}${yearCode}`;
        cb(fullcode, idForMonth);
      }
    })
    .catch((err) => {
      error(err);
    });
  //   }
  // })
  // .catch((err) => {
  //   error(err);
  // });
};

export const saveHistory = (
  labno = "",
  history = "",
  cb = (f) => f,
  error = (f) => f
) => {
  _updateApi(
    `${apiURL()}/lab/request/save-history`,
    {
      history,
      labno,
    },
    () => {
      cb();
    },
    () => {
      error();
    }
  );
};

export const saveLabRequest = (
  selectedLabs,
  receiptList,
  patient,
  visit_id,
  cb,
  error
) => {
  //   return (dispatch) => {
  const user = store.getState().auth.user;
  const facilityId = user.facilityId;
  let grouped = [];
  let singular = [];

  generateLabBookingNo(
    (yr, code) => {
      let patientId = patient.patientHospitalId;
      // let [_labId, _monthCode, _yearCode, _idForMonth] = booking.split("-");
      selectedLabs.forEach((lab, i) => {
        // let sampleStatus =
        //   lab.collect_sample === "yes"
        //     ? "pending"
        //     : lab.to_be_analyzed === "yes"
        //     ? "Sample Collected"
        //     : lab.upload_doc === "no"
        //     ? "uploaded"
        //     : lab.to_be_reported === "yes"
        //     ? "analyzed"
        //     : "pending";
        let sampleStatus = "ordered";

        if (lab.print_type === "single") {
          singular.push({
            // ...lab,
            test: lab.test,
            patient_id: patientId,
            facilityId,
            booking_no: [yr, parseInt(code) + i].join(""),
            price: lab.price,
            percentage: lab.percentage ? lab.percentage : "",
            department: lab.department,
            group: lab.group,
            code: lab.code,
            // status: "pending",
            status: sampleStatus,
            userId: user.username,
            visit_id,
          });
          // console.log(mCount)
          // mCount = mCount + 1
          // console.log(mCount)
        } else {
          grouped.push({
            // ...lab,
            test: lab.test,
            patient_id: patientId,
            facilityId,
            booking_no: [yr, code].join(""),
            price: lab.price,
            percentage: lab.percentage ? lab.percentage : 0,
            department: lab.department,
            group: lab.group,
            code: lab.code,
            status: sampleStatus,
            userId: user.username,
            visit_id,
          });
        }
      });
    },
    (err) => {
      console.log("Error: ", err);
    }
  );

  if (grouped.length) {
    let _booking = grouped[0].booking_no;
    saveHistory(_booking, "");
  }
  if (singular.length) {
    singular.forEach((m) => {
      saveHistory(m.booking_no, "");
    });
  }

  processLabTransaction(
    patient,
    // booking,
    grouped,
    singular,
    receiptList,
    cb,
    error
  );
  //   };
};
