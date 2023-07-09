import { DynamoDBStreamEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const destinationTable = 'statistics';

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    const newImage: any = record.dynamodb?.NewImage;
    console.log('New image:', newImage);

    try {
      const item = AWS.DynamoDB.Converter.unmarshall(newImage)
      item[PRIMARY_KEY] = uuidv4();
      console.log('Converted records', item);

      const params = {
        TableName: destinationTable,
        Item: item
      }

      await db.put(params).promise();

      console.log('Item inserted into destination table:', params);
      return { statusCode: 201, body: '' };
    } catch (error) {
      console.error('Error inserting item into destination table:', error);
    }
  }
};