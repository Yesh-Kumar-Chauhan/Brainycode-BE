// models/user.ts
import { DataTypes, ForeignKey, Model } from 'sequelize';
import { sequelize } from '../config/database';
import Subscriptions from './subscriptions.model';
import Users from './users.model';
import { IOrders } from '../interfaces/subscriptions.interface';
import Credits from './credits.model';

class Orders extends Model<IOrders> implements IOrders {
  
  public id!: string;
  public creditId!: ForeignKey<Credits['id']>;
  public subscriptionId!: ForeignKey<Subscriptions['id']>;
  public stripeId!: string;
  public amount!: number;
  public status!: string;
  public userId!: ForeignKey<Users['id']>;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Orders.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
    },
    creditId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    stripeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    modelName: 'Orders',
  }
);

Orders.belongsTo(Credits, { foreignKey: 'creditId' });
Credits.hasMany(Orders, { foreignKey: 'creditId' });

Orders.belongsTo(Subscriptions, { foreignKey: 'subscriptionId' });
Subscriptions.hasMany(Orders, { foreignKey: 'subscriptionId' });

export default Orders;
