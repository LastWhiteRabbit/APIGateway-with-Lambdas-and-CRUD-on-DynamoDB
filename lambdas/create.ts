import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Match } from './types';
import {logger} from '../logging/logging';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const db = new AWS.DynamoDB.DocumentClient();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {
  logger.debug('Running Create Lambda');

  logger.debug(`Received event body=${JSON.stringify(event.body)}`);

  if (!event.body) {
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  const item: Match = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  const itemId = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Item: {
      itemId,
      item
    },
  };

  try {
    await db.put(params).promise();
    logger.debug(`Successfully created match with id=${itemId}`);
    return {
      statusCode: 201,
      body: JSON.stringify({
        status: 'success',
        message: 'Data successfully ingested.',
        data: {
          event_id: itemId,
          timestamp: new Date().toISOString()
        }
      })
    };
  } catch (dbError) {
    logger.error(dbError);
    logger.error(JSON.stringify(dbError.errorMessage));
    logger.error(
      `Error creating a match with id ${itemId}.`
    );
    const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
      DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return { statusCode: 500, body: errorResponse };
  }
};
