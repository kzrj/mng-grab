"""ORM-модели (Persistence layer). Не путать с Domain Entities."""

from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AccountModel(Base, TimestampMixin):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    customers: Mapped[list["CustomerModel"]] = relationship("CustomerModel", back_populates="account")
    couriers: Mapped[list["CourierModel"]] = relationship("CourierModel", back_populates="account")


class CustomerModel(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id"), nullable=True, index=True)

    account: Mapped["AccountModel | None"] = relationship("AccountModel", back_populates="customers")
    orders: Mapped[list["OrderModel"]] = relationship("OrderModel", back_populates="owner")
    reviews: Mapped[list["ReviewModel"]] = relationship("ReviewModel", back_populates="customer")


class CourierModel(Base, TimestampMixin):
    __tablename__ = "couriers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id"), nullable=True, index=True)

    account: Mapped["AccountModel | None"] = relationship("AccountModel", back_populates="couriers")
    orders: Mapped[list["OrderModel"]] = relationship("OrderModel", back_populates="executor")
    reviews: Mapped[list["ReviewModel"]] = relationship("ReviewModel", back_populates="courier")


class OrderModel(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    where_to: Mapped[str] = mapped_column(String(255), nullable=False)
    where_from: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="new")
    date_when: Mapped[date] = mapped_column(Date, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    courier_id: Mapped[int | None] = mapped_column(ForeignKey("couriers.id"), nullable=True)

    owner: Mapped["CustomerModel"] = relationship("CustomerModel", back_populates="orders")
    executor: Mapped["CourierModel | None"] = relationship("CourierModel", back_populates="orders")


class ReviewModel(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    courier_id: Mapped[int] = mapped_column(ForeignKey("couriers.id"), nullable=False)

    customer: Mapped["CustomerModel"] = relationship("CustomerModel", back_populates="reviews")
    courier: Mapped["CourierModel"] = relationship("CourierModel", back_populates="reviews")
