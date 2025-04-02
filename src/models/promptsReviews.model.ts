// models/promptReviews.model.ts
import { DataTypes, ForeignKey, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { EnumReviewStatus, IPromptReviews } from '../interfaces/codeInterface.interface';
import Users from './users.model';
import Prompts from './prompts.model';
import Subscriptions from './subscriptions.model';

class PromptReviews extends Model<IPromptReviews> implements IPromptReviews {
    public id!: string;
    public userId!: ForeignKey<Users['id']>;
    public promptId!: ForeignKey<Prompts['id']>;
    public subscriptionId!:  ForeignKey<Subscriptions['id']>;
    public status!: EnumReviewStatus;
    public createdAt!: Date;
    public updatedAt!: Date;
}

PromptReviews.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        promptId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        subscriptionId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'PromptReviews',
    }
);


PromptReviews.belongsTo(Prompts, { foreignKey: 'promptId' });
Prompts.hasMany(PromptReviews, { foreignKey: 'promptId' });

PromptReviews.belongsTo(Subscriptions, { foreignKey: 'subscriptionId' });
Subscriptions.hasMany(PromptReviews, { foreignKey: 'subscriptionId' });

export default PromptReviews;
