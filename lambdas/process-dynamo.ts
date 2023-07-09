import { DynamoDBStreamEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Statistic } from './types';

const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const DESTINATION_TABLE_NAME = process.env.DESTINATION_TABLE_NAME || 'statistics';

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: DynamoDBStreamEvent) => {

  for (const record of event.Records) {
    const newImage: any = record.dynamodb?.NewImage;
    console.log('New image:', newImage);

    try {
      const item = AWS.DynamoDB.Converter.unmarshall(newImage)
      item[PRIMARY_KEY] = uuidv4();
      console.log('Converted records', item);
      const { match_id } = item;

      const existingStatistic = await db.get({
        TableName: DESTINATION_TABLE_NAME,
        Key: {
          [PRIMARY_KEY]: match_id
        }
      }).promise();

      console.log('Existing statistic:', JSON.stringify(existingStatistic.Item));

      if (existingStatistic.Item) {
        await db.update({
          TableName: DESTINATION_TABLE_NAME,
          Key: {
            [PRIMARY_KEY]: match_id
          },
          UpdateExpression: 'SET total_goals = :total_goals + :increment',
          ExpressionAttributeValues: {
            ':increment': 1,
            ':total_goals': existingStatistic.Item.total_goals
          },
          ReturnValues: 'UPDATED_NEW'
        }).promise();

        console.log('Statistic table update');
        return { statusCode: 200, body: '' };

      }

      const matchStatistic: Statistic = {
        team: item.team,
        opponent: item.opponent,
        total_goals: 1
      }
      matchStatistic[PRIMARY_KEY] = match_id;

      const params = {
        TableName: DESTINATION_TABLE_NAME,
        Item: matchStatistic
      }

      await db.put(params).promise();

      console.log('Item inserted into destination table:', params);
      return { statusCode: 201, body: '' };
    } catch (error) {
      console.error('Error inserting item into destination table:', error);
    }
  }
};