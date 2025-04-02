// models/subscriptions.model.ts
import { DataTypes, ForeignKey, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { EnumSubscriptionCreditType, EnumSubscriptionType, ISubscription } from '../interfaces/subscriptions.interface';

class Subscriptions extends Model<ISubscription> implements ISubscription {
    public id!: string;
    public credit!: EnumSubscriptionCreditType;
    public title!: string;
    public description!: string;
    public subscriptionType!: EnumSubscriptionType;
    public price!: number;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Subscriptions.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
        },
        credit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        subscriptionType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
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
        modelName: 'Subscriptions',
    }
);

export default Subscriptions;
