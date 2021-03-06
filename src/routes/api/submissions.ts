import {Request, Router} from 'express'
import {SubmissionAttributes, Submissions} from '../../db/models'
import {queueJob, SubmissionJob} from '../../rabbitmq/jobqueue'

const route: Router = Router()

export type SubmissionRequestBody = {
  source: string,
  lang: string,
  testcases: [{input: string, output:string}]
  getstdout: boolean,
  callbackurl: string
}
export interface SubmissionRequest extends Request {
  body: SubmissionRequestBody
}

export interface SubmissionResponse {
  id: number,
  accepted: boolean,
  callbackurl: string
}

/**
 * @api {get} /submissions GET /submissions
 * @apiDescription List of all previous submissions
 * @apiName GetSubmissions
 * @apiGroup Submissions
 * @apiVersion 0.0.1
 */
route.get('/', (req, res, next) => {
  Submissions.findAll()
    .then(submissions => res.status(200).json(submissions))
    .catch(err => res.status(501).json({
      code: 501,
      message: "Could not fetch submissions",
      error: err
    }))
})

/**
 * @api {post} /submissions POST /submissions
 * @apiDescription Check a code with given testcases
 * @apiName PostSubmissions
 * @apiGroup Submissions
 * @apiVersion 0.0.1
 *
 * @apiParam {URL} source URL of file containing the source code to run
 * @apiParam {Enum} lang Language of code to execute
 * @apiParam {Array(Object)} testcases Array of urls of input and output testcases
 * @apiParam {Boolean} getstdout Defines if the results will carry value of stdout and stderr (default: false)
 * @apiParam {URL} callbackurl An url which we will call (POST) with the judgement results
 *
 * @apiUse AvailableLangs
 * @apiParamExample {Array} testcases
 *  [
 *    {"input": "http://file.cb.lk/1872634.txt", "output": "http://file.cb.lk/151312.txt"},
 *    {"input": "http://file.cb.lk/1827312.txt", "output": "http://file.cb.lk/123121.txt"},
 *    {"input": "http://file.cb.lk/1314114.txt", "output": "http://file.cb.lk/513123.txt"}
 *  ]
 *
 * @apiSuccess {Number} id
 * @apiSuccess {Boolean} accepted
 * @apiSuccess {URL} callbackurl The url we will POST back the result to
 * @apiSuccessExample Success-Example:
 * HTTP/1.1 200 OK
 * {
 *  "id": 22,
 *  "accepted": true,
 *  "callbackurl": "http://app.cb.lk/judgement/result"
 * }
 *
 * @apiSuccess (Callback) {Number} id
 * @apiSuccess (Callback) {Array} results Array of object with results
 * (with optionally stderr and stdout inside them if `getstdout` was set **true** in request)
 * @apiSuccessExample Callback Body:
 * HTTP/1.1 POST
 * {
 *  "id": 22,
 *  "results": [
 *    {"statuscode": 0, "stdout": "JB81jv=", "stderr": "TnVsbFBvaW50Zng2KB2jbaRpb24="},
 *    {"statuscode": 0, "stdout": "Mbj15A=", "stderr": "TnVsbFBvabjg12bfjGNlcHRpb24="},
 *    {"statuscode": 0, "stdout": "UV131b=", "stderr": "TnVsbFBvaW50ZXJFeGNlcHRpb24="},
 *   ]
 * }
 */
route.post('/', (req: SubmissionRequest, res, next) => {
  // TODO: Validate parameters of submission request (like source should be url)
  Submissions.create(<SubmissionAttributes>{
    lang: req.body.lang,
    start_time: new Date()
  }).then((submission: SubmissionAttributes) => {

    let queued = queueJob(<SubmissionJob>{
      id: submission.id,
      source: req.body.source,
      testcases: req.body.testcases,
      getstdout: req.body.getstdout
    })

    res.status(202).json(<SubmissionResponse>{
      id: submission.id,
      accepted: queued,
      callbackurl: req.body.callbackurl
    })
  }).catch(err => {
    res.status(501).json({
      code: 501,
      message: "Could not accept submission",
      error: err
    })
  })
})

export {route}